exports.handler = async (event, context, callback) => {

  let basePath = ''
  if (process.env.NODE_ENV === 'production') {
    basePath = 'src';
  } else {
    basePath = 'stubs'
  }
  let errors = [];
  (event.migrations || [])
    .map(migration => `./${basePath}/migrations/${migration}.js`)
    .map(async (migration) => {
      let toMigrate;
      try {
        toMigrate = require(migration);
      } catch (e) {
        console.error(`migration ${migration} does not exists`);
        callback(e);
        return;
      }

      try {
        console.log(`executing migration ${migration}`);
        await toMigrate();
        console.log(`end migration ${migration}`)
      } catch (e){
        errors.push(e);
        console.error(e)
      }
    });

  if (errors.length > 0) {
    callback(errors);
  } else {
    callback(null, 200);
  }
};
