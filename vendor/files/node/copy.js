const path = require('path');
const fs = require('fs');
const contentPath = path.join(__dirname, '../../', '/whistle/biz/webui/htdocs/js/index.js');
const content = fs.readFileSync(contentPath);
fs.writeFileSync(path.join(__dirname, 'modules/whistle/biz/webui/htdocs/js/index.js'), content);