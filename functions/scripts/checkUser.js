const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

async function checkUser() {
  const email = 'pavithrasevakula@gmail.com';
  
  // Find user by email
  const usersSnap = await db.collection('users').where('email', '==', email).get();
  
  if (usersSnap.empty) {
    console.log('❌ No user document found for', email);
    console.log('This is why your profile data disappears on refresh!');
    
    // Check if auth user exists
    try {
      const authUser = await admin.auth().getUserByEmail(email);
      console.log('\\n✅ Auth user exists with UID:', authUser.uid);
      console.log('\\n🔧 Need to create user document in Firestore');
    } catch (err) {
      console.log('\\n❌ Auth user also missing');
    }
  } else {
    usersSnap.forEach(doc => {
      console.log('✅ User document found!');
      console.log('UID:', doc.id);
      console.log('Data:', JSON.stringify(doc.data(), null, 2));
    });
  }
  
  process.exit(0);
}

checkUser().catch(err => { console.error(err); process.exit(1); });
