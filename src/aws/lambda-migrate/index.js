exports.handler = async (event, context, callback) => {

  let basePath = ''
  if (process.env.NODE_ENV === 'production') {
    basePath = 'src';
  } else {
    basePath = 'stubs'
  }
  let errors = [];
  (process.env.MIGRATIONS || '')
    .split(",")
    .reduce((acc, migration) => {
      if (migration.length > 0) {
        acc.push(migration.trim());
      }

      return acc;
    }, [])
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
