import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { applyToProject } from '../api';

export default function TeamLab() {
  const [activeTab, setActiveTab] = useState('simulator');
  const [projects, setProjects] = useState([]);
  const [labData, setLabData] = useState({
    incomingInvites: [],
    sentInvites: [],
    tasks: [],
    agreements: [],
    teamHealth: [],
    preferences: null
  });
  const [simulationResults, setSimulationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState(false);

  // Form states
  const [selectedProject, setSelectedProject] = useState('');
  const [preferences, setPreferences] = useState({
    learningSkills: '',
    mentorSkills: '',
    weeklyHours: 4,
    meetingTimes: '',
    communicationStyle: 'Flexible',
    responseExpectation: 'Within a day',
    projectDuration: 'Flexible',
    workStyle: 'Collaborative',
    evidenceLinks: ''
  });

  const showMessage = useCallback((msg, isError = false) => {
    setMessage(msg);
    setMessageError(isError);
    setTimeout(() => {
      setMessage('');
      setMessageError(false);
    }, 4200);
  }, []);

  const loadLabData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        return;
      }

      // Load user's projects (try both ownerUserId and ownerId for backward compatibility)
      try {
        const projectsSnap = await getDocs(
          query(collection(db, 'projects'), where('ownerUserId', '==', user.uid))
        );
        const userProjects = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProjects(userProjects);
      } catch (projError) {
        console.warn('Could not load projects:', projError.message);
        setProjects([]);
      }

      // Use single-field queries so the workspace remains available while optional
      // composite indexes are building. Filter and sort the small per-user set locally.
      const [incomingResult, sentResult] = await Promise.allSettled([
        getDocs(query(collection(db, 'teamInvitations'), where('inviteeId', '==', user.uid))),
        getDocs(query(collection(db, 'teamInvitations'), where('invitedBy', '==', user.uid)))
      ]);

      const incomingInvites = incomingResult.status === 'fulfilled'
        ? incomingResult.value.docs
          .map(inviteDoc => ({ id: inviteDoc.id, ...inviteDoc.data() }))
          .filter(invite => invite.status === 'pending')
        : [];
      const sentInvites = sentResult.status === 'fulfilled'
        ? sentResult.value.docs
          .map(inviteDoc => ({ id: inviteDoc.id, ...inviteDoc.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
          .slice(0, 50)
        : [];

      setLabData(prevData => ({
        ...prevData,
        incomingInvites,
        sentInvites
      }));

      if (incomingResult.status === 'rejected' || sentResult.status === 'rejected') {
        const failedAreas = [
          incomingResult.status === 'rejected' ? 'incoming' : null,
          sentResult.status === 'rejected' ? 'sent' : null
        ].filter(Boolean).join(' and ');
        console.error(`Could not load ${failedAreas} invitations.`);
        showMessage(`Could not load ${failedAreas} invitations. Please refresh and try again.`, true);
      }

      // Load user preferences
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userPrefs = userDoc.data()?.labPreferences || null;
        if (userPrefs) {
          setPreferences({
            learningSkills: userPrefs.learningSkills?.join(', ') || '',
            mentorSkills: userPrefs.mentorSkills?.join(', ') || '',
            weeklyHours: userPrefs.weeklyHours || 4,
            meetingTimes: userPrefs.meetingTimes?.join(', ') || '',
            communicationStyle: userPrefs.communicationStyle || 'Flexible',
            responseExpectation: userPrefs.responseExpectation || 'Within a day',
            projectDuration: userPrefs.projectDuration || 'Flexible',
            workStyle: userPrefs.workStyle || 'Collaborative',
            evidenceLinks: userPrefs.evidenceLinks?.map(e => `${e.label} | ${e.url}`).join('\n') || ''
          });
        }

        setLabData(prevData => ({
          ...prevData,
          preferences: userPrefs
        }));
      } catch (prefError) {
        console.warn('Could not load preferences:', prefError.message);
      }
    } catch (error) {
      console.error('Error loading lab data:', error);
      showMessage(`Could not load data: ${error.message}`, true);
    }
  }, [showMessage]);

  useEffect(() => {
    // Start the initial fetch asynchronously; its results are applied via setState when they arrive.
    Promise.resolve().then(loadLabData);
  }, [loadLabData]);

  const loadSimulationUser = async (userId) => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    const [skillsSnap, rolesSnap] = await Promise.all([
      getDocs(collection(db, 'users', userId, 'skills')),
      getDocs(collection(db, 'users', userId, 'preferredRoles')),
    ]);
    return {
      id: userId,
      ...userDoc.data(),
      skills: skillsSnap.docs.map((skillDoc) => ({
        name: skillDoc.data().skillName,
        level: skillDoc.data().proficiencyLevel,
      })),
      preferredRoles: rolesSnap.docs.map((roleDoc) => roleDoc.data().roleId),
    };
  };

  const handleRunSimulation = async () => {
    if (!selectedProject) {
      showMessage('Choose a project you own first.', true);
      return;
    }

    setLoading(true);
    setSimulationResults(null);

    try {
      const projectDoc = await getDoc(doc(db, 'projects', selectedProject));
      const project = { id: projectDoc.id, ...projectDoc.data() };

      // Get current team members
      const applicationsSnap = await getDocs(
        query(
          collection(db, 'projects', selectedProject, 'applications'),
          where('status', '==', 'Accepted')
        )
      );
      const teamMemberIds = [project.ownerUserId, ...applicationsSnap.docs.map((applicationDoc) => applicationDoc.data().profileId)];

      const teamMembers = (await Promise.all(teamMemberIds.map((memberId) => loadSimulationUser(memberId)))).filter(Boolean);

      // Get candidate pool (excluding current members and pending invitations)
      const allUsersSnap = await getDocs(collection(db, 'users'));
      const candidateDocs = allUsersSnap.docs
        .filter((candidateDoc) => !teamMemberIds.includes(candidateDoc.id))
        .slice(0, 100);
      const candidates = (await Promise.all(candidateDocs.map((candidateDoc) => loadSimulationUser(candidateDoc.id)))).filter(Boolean);

      // Run simulation
      const scenarios = runTeamSimulation(project, teamMembers, candidates);
      setSimulationResults({ project, scenarios });
      showMessage('Team scenarios generated successfully.');
    } catch (error) {
      console.error('Error running simulation:', error);
      showMessage(error.message, true);
    } finally {
      setLoading(false);
    }
  };

  const runTeamSimulation = (project, teamMembers, candidates) => {
    const requiredSkills = project.requiredSkills || [];
    const requiredRoles = project.requiredRoles || [];
    const targetTeamSize = project.teamSizeRequired || 4;

    const calculateCoverage = (team) => {
      return requiredSkills.map(reqSkill => {
        const teamSkillLevels = team.map(member => {
          const skill = member.skills?.find(s =>
            (s.name || s.skillName || '').toLowerCase() === (reqSkill.skillName || reqSkill.name || '').toLowerCase()
          );
          return skill ? (skill.level ?? skill.proficiencyLevel ?? 0) : 0;
        });
        const requiredLevel = reqSkill.minProficiency ?? reqSkill.level ?? 0;
        const maxLevel = Math.max(0, ...teamSkillLevels);
        const backupCount = teamSkillLevels.filter(level => level >= requiredLevel).length;
        
        return {
          name: reqSkill.skillName || reqSkill.name,
          required: requiredLevel,
          level: Math.min(requiredLevel, maxLevel),
          covered: maxLevel >= requiredLevel,
          backupCount
        };
      });
    };

    const calculateMetrics = (team) => {
      const coverage = calculateCoverage(team);
      const coveredSkills = coverage.filter(c => c.covered).length;
      const skillCoverage = requiredSkills.length ? Math.round((coveredSkills / requiredSkills.length) * 100) : 100;

      const teamRoles = new Set(team.flatMap(m => m.preferredRoles || []));
      const roleMatches = requiredRoles.filter(r => teamRoles.has(r.roleId)).length;
      const roleCoverage = requiredRoles.length ? Math.round((roleMatches / requiredRoles.length) * 100) : 100;

      const singlePointSkills = coverage.filter(c => c.covered && c.backupCount === 1).length;
      const skillGaps = coverage.filter(c => !c.covered).map(c => c.name);

      return {
        coverage: skillCoverage,
        roleCoverage,
        scheduleCompatibility: 75, // Simplified
        commitmentFit: 80, // Simplified
        singlePointSkills,
        skillGaps,
        coverageDetails: coverage
      };
    };

    const buildTeam = (strategy) => {
      const team = [...teamMembers];
      const pool = [...candidates];

      while (team.length < targetTeamSize && pool.length > 0) {
        let bestIdx = 0;
        let bestScore = -1;

        pool.forEach((candidate, idx) => {
          const currentCoverage = calculateCoverage(team);
          let score = 0;

          // Calculate skill gain
          requiredSkills.forEach(reqSkill => {
            const currentLevel = currentCoverage.find(c => c.name === (reqSkill.skillName || reqSkill.name))?.level || 0;
            const candidateSkill = candidate.skills?.find(s =>
              (s.name || s.skillName || '').toLowerCase() === (reqSkill.skillName || reqSkill.name || '').toLowerCase()
            );
            const candidateLevel = candidateSkill ? (candidateSkill.level ?? candidateSkill.proficiencyLevel ?? 0) : 0;
            const requiredLevel = reqSkill.minProficiency ?? reqSkill.level ?? 1;
            const gain = Math.max(0, Math.min(requiredLevel, candidateLevel) - currentLevel);
            score += gain / Math.max(1, requiredLevel);
          });

          // Strategy-specific weights
          if (strategy === 'balanced') {
            // Role fit
            const roleGain = (candidate.preferredRoles || []).filter(roleId =>
              requiredRoles.some(requiredRole => requiredRole.roleId === roleId) &&
              !team.some(member => (member.preferredRoles || []).includes(roleId))
            ).length;
            score += roleGain * 0.3;
          }

          if (score > bestScore) {
            bestScore = score;
            bestIdx = idx;
          }
        });

        team.push(pool.splice(bestIdx, 1)[0]);
      }

      const metrics = calculateMetrics(team);
      return {
        members: team.map(m => ({
          id: m.id,
          name: m.displayName || 'Student',
          role: (m.preferredRoles && m.preferredRoles[0]) || 'Contributor'
        })),
        ...metrics
      };
    };

    return [
      { key: 'coverage', label: 'Skill coverage first', team: buildTeam('coverage') },
      { key: 'balanced', label: 'Balanced fit', team: buildTeam('balanced') },
      { key: 'reliable', label: 'Commitment-aware', team: buildTeam('reliable') },
      { key: 'fair', label: 'Fair opportunity & growth', team: buildTeam('fair') }
    ];
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      const evidenceLinks = preferences.evidenceLinks
        .split('\n')
        .map(line => {
          const idx = line.indexOf('|');
          if (idx < 0) return null;
          return {
            label: line.slice(0, idx).trim(),
            url: line.slice(idx + 1).trim()
          };
        })
        .filter(Boolean);

      const prefsData = {
        learningSkills: preferences.learningSkills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean),
        mentorSkills: preferences.mentorSkills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean),
        weeklyHours: Number(preferences.weeklyHours),
        meetingTimes: preferences.meetingTimes.split(/[,;\n]/).map(s => s.trim()).filter(Boolean),
        communicationStyle: preferences.communicationStyle,
        responseExpectation: preferences.responseExpectation,
        projectDuration: preferences.projectDuration,
        workStyle: preferences.workStyle,
        evidenceLinks
      };

      await updateDoc(doc(db, 'users', user.uid), {
        labPreferences: prefsData,
        updatedAt: serverTimestamp()
      });

      showMessage('Growth profile saved.');
    } catch (error) {
      console.error('Error saving preferences:', error);
      showMessage(error.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteResponse = async (inviteId, status) => {
    try {
      const inviteRef = doc(db, 'teamInvitations', inviteId);
      const inviteSnapshot = await getDoc(inviteRef);
      const invite = inviteSnapshot.data();
      if (!invite) throw new Error('Invitation no longer exists.');

      if (status === 'accepted') {
        await applyToProject({ projectId: invite.projectId, roleId: invite.proposedRole });
      }
      await updateDoc(inviteRef, { status, updatedAt: serverTimestamp() });

      if (status === 'accepted') {
        showMessage('Invitation accepted — your application was submitted.');
      } else {
        showMessage('Invitation declined.');
      }

      await loadLabData();
    } catch (error) {
      console.error('Error responding to invite:', error);
      showMessage(error.message, true);
    }
  };

  const handleSendInvite = async (userId, projectId, role) => {
    const message = prompt(`Optional invitation note (role: ${role})`, 'I think your skills could complement this team.');
    if (message === null) return;

    try {
      await addDoc(collection(db, 'teamInvitations'), {
        projectId,
        invitedBy: auth.currentUser.uid,
        inviteeId: userId,
        proposedRole: role,
        message,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      showMessage('Invitation sent. The student can accept or decline.');
      await loadLabData();
    } catch (error) {
      console.error('Error sending invite:', error);
      showMessage(error.message, true);
    }
  };

  return (
    <div className="team-lab-panel panel">
      <div className="panel-header">
        <div>
          <div className="section-kicker normal-case">TeamSync Plus</div>
          <h1 className="lab-page-title">Team Lab</h1>
          <p className="lab-subtitle">Plan stronger teams, support student growth, and keep projects moving.</p>
        </div>
      </div>

      {message && (
        <div className={`lab-disclaimer ${messageError ? 'error' : ''}`} role="status" aria-live="polite">
          {message}
        </div>
      )}

      <div className="lab-tabs" role="tablist" aria-label="Team Lab tools">
        <button
          role="tab"
          className={`lab-tab ${activeTab === 'simulator' ? 'active' : ''}`}
          aria-selected={activeTab === 'simulator'}
          onClick={() => setActiveTab('simulator')}
        >
          Team simulator
        </button>
        <button
          role="tab"
          className={`lab-tab ${activeTab === 'growth' ? 'active' : ''}`}
          aria-selected={activeTab === 'growth'}
          onClick={() => setActiveTab('growth')}
        >
          Growth profile
        </button>
        <button
          role="tab"
          className="lab-tab"
          aria-selected="false"
          disabled
          title="Team agreements are coming soon"
        >
          Team agreements
        </button>
        <button
          role="tab"
          className="lab-tab"
          aria-selected="false"
          disabled
          title="Weekly check-in is coming soon"
        >
          Weekly check-in
        </button>
        <button
          role="tab"
          className={`lab-tab ${activeTab === 'invitations' ? 'active' : ''}`}
          aria-selected={activeTab === 'invitations'}
          onClick={() => setActiveTab('invitations')}
        >
          Invitations
        </button>
      </div>

      {/* Team Simulator Tab */}
      {activeTab === 'simulator' && (
        <div className="lab-pane active">
          <div className="lab-toolbar">
            <label className="field">
              Your project
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">Choose a project you own</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </label>
            <button
              className="btn btn-primary"
              onClick={handleRunSimulation}
              disabled={loading}
            >
              {loading ? 'Comparing...' : 'Compare team scenarios'}
            </button>
          </div>
          <p className="lab-hint">
            Compare skill coverage, role coverage, availability and single-person dependencies before inviting anyone. 
            Scores are planning estimates, not predictions of success.
          </p>
          <div className="lab-results">
            {!simulationResults ? (
              <div className="lab-empty">Choose a project you own to compare possible team compositions.</div>
            ) : (
              <>
                <div className="lab-disclaimer">
                  Scenario scores are planning estimates based on self-reported profiles, not guarantees of team performance.
                </div>
                <div className="lab-scenario-grid">
                  {simulationResults.scenarios.map(scenario => (
                    <article key={scenario.key} className="lab-scenario">
                      <div className="lab-scenario-head">
                        <span className="lab-scenario-label">{scenario.label}</span>
                        <span className="lab-score">
                          {scenario.team.coverage}%
                          <small>skill coverage</small>
                        </span>
                      </div>
                      <div className="lab-metrics">
                        <div>
                          <strong>{scenario.team.roleCoverage}%</strong>
                          <span>Role coverage</span>
                        </div>
                        <div>
                          <strong>{scenario.team.scheduleCompatibility}%</strong>
                          <span>Schedule fit</span>
                        </div>
                        <div>
                          <strong>{scenario.team.commitmentFit}%</strong>
                          <span>Hours fit</span>
                        </div>
                        <div>
                          <strong>{scenario.team.singlePointSkills}</strong>
                          <span>Single-person skills</span>
                        </div>
                      </div>
                      <div className="lab-detail-title">Skill gaps</div>
                      <div className="lab-tags">
                        {scenario.team.skillGaps.length > 0 ? (
                          scenario.team.skillGaps.map(gap => (
                            <span key={gap} className="lab-tag warning">{gap}</span>
                          ))
                        ) : (
                          <span className="lab-tag good">No required skill gaps</span>
                        )}
                      </div>
                      <div className="lab-detail-title">Proposed team</div>
                      <div className="lab-members">
                        {scenario.team.members.map(member => (
                          <div key={member.id} className="lab-member">
                            <span className="lab-avatar">
                              {(member.name || 'S').slice(0, 1).toUpperCase()}
                            </span>
                            <span>
                              <strong>{member.name}</strong>
                              <small>{member.role}</small>
                            </span>
                            {member.id !== auth.currentUser?.uid ? (
                              <button
                                className="btn btn-quiet lab-invite"
                                onClick={() => handleSendInvite(member.id, simulationResults.project.id, member.role)}
                              >
                                Invite
                              </button>
                            ) : (
                              <span className="lab-you">You</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="lab-detail-title">Coverage by skill</div>
                      <div className="lab-coverage">
                        {scenario.team.coverageDetails.map(cov => (
                          <div key={cov.name} className="lab-coverage-row">
                            <span>{cov.name}</span>
                            <div className="lab-progress">
                              <i style={{ width: `${Math.round((cov.level / Math.max(1, cov.required)) * 100)}%` }}></i>
                            </div>
                            <small>
                              {cov.level}/{cov.required}
                              {cov.backupCount > 1 ? ` · ${cov.backupCount} backups` : 
                               cov.backupCount === 1 ? ' · single point' : ''}
                            </small>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Growth Profile Tab */}
      {activeTab === 'growth' && (
        <div className="lab-pane active">
          <form onSubmit={handleSavePreferences} className="lab-form-grid">
            <label className="field">
              Skills I want to learn
              <textarea
                rows="2"
                placeholder="e.g. UX research, Python, data visualization"
                value={preferences.learningSkills}
                onChange={(e) => setPreferences({ ...preferences, learningSkills: e.target.value })}
              />
            </label>
            <label className="field">
              Skills I can mentor
              <textarea
                rows="2"
                placeholder="e.g. Git, presentation design"
                value={preferences.mentorSkills}
                onChange={(e) => setPreferences({ ...preferences, mentorSkills: e.target.value })}
              />
            </label>
            <label className="field">
              Available hours per week
              <input
                type="number"
                min="1"
                max="40"
                value={preferences.weeklyHours}
                onChange={(e) => setPreferences({ ...preferences, weeklyHours: e.target.value })}
              />
            </label>
            <label className="field">
              Preferred meeting times
              <input
                placeholder="e.g. Weekday evenings, Saturday"
                value={preferences.meetingTimes}
                onChange={(e) => setPreferences({ ...preferences, meetingTimes: e.target.value })}
              />
            </label>
            <label className="field">
              Communication style
              <select
                value={preferences.communicationStyle}
                onChange={(e) => setPreferences({ ...preferences, communicationStyle: e.target.value })}
              >
                <option>Flexible</option>
                <option>Chat-first</option>
                <option>Video meetings</option>
                <option>Written updates</option>
              </select>
            </label>
            <label className="field">
              Response expectation
              <select
                value={preferences.responseExpectation}
                onChange={(e) => setPreferences({ ...preferences, responseExpectation: e.target.value })}
              >
                <option>Within a few hours</option>
                <option>Within a day</option>
                <option>Within two days</option>
                <option>Flexible</option>
              </select>
            </label>
            <label className="field">
              Project duration preference
              <select
                value={preferences.projectDuration}
                onChange={(e) => setPreferences({ ...preferences, projectDuration: e.target.value })}
              >
                <option>Flexible</option>
                <option>Short (1–3 weeks)</option>
                <option>Medium (1–2 months)</option>
                <option>Long (semester)</option>
              </select>
            </label>
            <label className="field">
              Working style
              <select
                value={preferences.workStyle}
                onChange={(e) => setPreferences({ ...preferences, workStyle: e.target.value })}
              >
                <option>Collaborative</option>
                <option>Independent focus</option>
                <option>Structured and planned</option>
                <option>Experimental and iterative</option>
              </select>
            </label>
            <label className="field full-field">
              Portfolio evidence (one per line: label | https://link)
              <textarea
                rows="2"
                placeholder="Data project | https://github.com/…"
                value={preferences.evidenceLinks}
                onChange={(e) => setPreferences({ ...preferences, evidenceLinks: e.target.value })}
              />
              <span className="field-help">Evidence is optional. Links are displayed as self-reported examples, not verified credentials.</span>
            </label>
            <div className="lab-form-actions">
              <span className="lab-hint">Your learning goals help teams identify growth opportunities.</span>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save growth profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Agreements Tab */}
      {activeTab === 'collaboration' && (
        <div className="lab-pane active">
          <div className="lab-empty">Team agreements and task board features coming soon.</div>
        </div>
      )}

      {/* Weekly Check-in Tab */}
      {activeTab === 'checkin' && (
        <div className="lab-pane active">
          <div className="lab-empty">Weekly check-in feature coming soon.</div>
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="lab-pane active">
          <div className="lab-list">
            {labData.incomingInvites.length > 0 ? (
              labData.incomingInvites.map(invite => (
                <article key={invite.id} className="lab-list-item">
                  <div>
                    <strong>{invite.projectTitle || 'Project invitation'}</strong>
                    <p>Invited by {invite.inviterName || 'Project owner'} · {invite.proposedRole}</p>
                    <p>{invite.message}</p>
                  </div>
                  <div className="lab-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleInviteResponse(invite.id, 'accepted')}
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-quiet"
                      onClick={() => handleInviteResponse(invite.id, 'declined')}
                    >
                      Decline
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="lab-empty">No pending invitations. Any invitation you receive will appear here.</div>
            )}
          </div>

          <h3 className="lab-subheading">Invitations you sent</h3>
          <div className="lab-list">
            {labData.sentInvites.length > 0 ? (
              labData.sentInvites.map(invite => (
                <article key={invite.id} className="lab-list-item">
                  <div>
                    <strong>{invite.projectTitle || 'Project'}</strong>
                    <p>To {invite.inviteeName || 'Student'} · {invite.proposedRole}</p>
                  </div>
                  <span className={`lab-status ${invite.status}`}>{invite.status}</span>
                </article>
              ))
            ) : (
              <div className="lab-empty">You have not sent any invitations yet.</div>
            )}
          </div>
        </div>
      )}

      <div className="lab-footer-note">
        <strong>Built for healthier collaboration.</strong>
        <span>Scores support decisions; they never replace student choice or guarantee team success.</span>
      </div>
    </div>
  );
}
