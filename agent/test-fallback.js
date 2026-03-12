const activeWin = require('active-win');

async function getActiveWindow() {
    try {
        const getWindows = require('get-windows');
        const activeWins = await getWindows.activeWindow();
        console.log("get-windows output:", activeWins);

        const win = activeWins;
        let url = '';
        const appName = win?.owner?.name || '';
        let title = win?.title || '';

        if (!url && ['Google Chrome', 'Microsoft Edge', 'Brave', 'Firefox', 'Opera'].includes(appName)) {
            if (title) {
                let cleanTitle = title;
                cleanTitle = cleanTitle.replace(/\s*-\s*Google Chrome$/, '');
                cleanTitle = cleanTitle.replace(/\s*-\s*Microsoft\u200b Edge$/, '');
                cleanTitle = cleanTitle.replace(/\s*-\s*Microsoft Edge$/, '');
                cleanTitle = cleanTitle.replace(/\s*-\s*Brave$/, '');
                cleanTitle = cleanTitle.replace(/\s*-\s*Mozilla Firefox$/, '');
                cleanTitle = cleanTitle.replace(/\s*-\s*Opera$/, '');
                cleanTitle = cleanTitle.replace(/\s*-\s*Profile \d+$/, '');
                cleanTitle = cleanTitle.replace(/\s*-\s*Personal$/, '');
                url = cleanTitle;
            }
        }

        return {
            title: title,
            app: appName,
            url: url
        };
    } catch (err) {
        console.error("Error:", err);
        return { title: 'Error', app: 'Error', url: '' };
    }
}

(async () => {
    console.log(await getActiveWindow());
})();
