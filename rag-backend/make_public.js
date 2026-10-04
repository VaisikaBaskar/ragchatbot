require('dotenv').config();
const mongoose = require('mongoose');
const Document = require('./src/models/Document');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const docIds = [
      '69df2c664d57c3036716e8c1',
      '69fc2547d075674c45ded6c6'
    ];

    const result = await Document.updateMany(
      { _id: { $in: docIds } },
      { $set: { isPublic: true } }
    );

    console.log('Updated documents:', result.modifiedCount);

    // Verify the update
    const docs = await Document.find({ _id: { $in: docIds } }).lean();
    docs.forEach(doc => {
      console.log(`${doc.fileName}: public = ${doc.isPublic}`);
    });

  } catch(e) {
    console.error('Error:', e);
  }
  process.exit(0);
})();