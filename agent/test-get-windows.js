const { activeWindow } = require('get-windows');
(async () => {
    console.log(await activeWindow());
})();
