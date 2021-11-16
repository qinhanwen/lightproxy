const path = require('path');
const fs = require('fs');
const content = fs.readFileSync('./index.js');
fs.writeFileSync(path.resolve(__dirname, 'modules/whistle/biz/webui/htdocs/js/index.js'), content);
console.log('copy index.js 成功，index.js 是从 whistle/biz/webui/htdocs/js/index.js ，被打包出来的')