/* eslint-disable @typescript-eslint/no-unsafe-member-access */
module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await db.collection('users').update({},
      {$set:{'connections': []}},
      {multi: true},
      (err, data)=>{
            //todo
          console.log('our err ', err);
          console.log('our data ', data);
      })
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
