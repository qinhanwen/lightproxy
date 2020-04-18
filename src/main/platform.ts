// platform specific code

import os from 'os';
import { app } from 'electron';
import { execSync, exec } from 'child_process';
import { PROXY_CONF_HELPER_PATH, PROXY_REFRESH_WINDOWS_HELPER_PATH } from './const';
import logger from 'electron-log';
import globalProxy from '@xcodebuild/global-proxy';

const systemType = os.type();
const SYSTEM_IS_MACOS = systemType === 'Darwin';

export function hideIconInDock() {
    if (SYSTEM_IS_MACOS) {
        app.hide();
        app.dock.hide();
    }
}

interface ProxyInfo {
    HTTPEnable: string;
    HTTPPort: string;
    HTTPProxy: string;
    HTTPSEnable: string;
    HTTPSPort: string;
    HTTPSProxy: string;
    ProxyAutoConfigEnable: string;
    SOCKSEnable: string;
}

function covertOutputToJSON(output: string) {
    // @ts-ignore
    const content = /{[^]*?}/.exec(output)[0];
    const jsonContent = content
        .replace(/([a-zA-Z0-9\.]+)/g, '"$1"')
        .replace(/"\n/g, '",\n')
        .replace(/,.*\n?}/, '}');
    return jsonContent;
}

export async function checkSystemProxyWork(address: string, port: number) {
    return new Promise((resolve, reject) => {
        if (!SYSTEM_IS_MACOS) {
            reject();
            return;
        }
        exec('scutil --proxy', (error, stdout, stderr) => {
            const NO_NETWORK_OUTPUT = `<dictionary> {
}
`;

            function checkProxyInfo(info: ProxyInfo, portStr: string) {
                return (
                    info.HTTPEnable === '1' &&
                    info.HTTPPort === portStr &&
                    info.HTTPProxy === address &&
                    info.HTTPSEnable === '1' &&
                    info.HTTPSPort === portStr &&
                    info.HTTPSProxy === address &&
                    info.ProxyAutoConfigEnable === '0' &&
                    info.SOCKSEnable === '0'
                );
            }

            try {
                const output = stdout.toString();

                if (output === NO_NETWORK_OUTPUT) {
                    // no network, no proxy info
                    reject('no network');
                }

                // @ts-ignore
                const jsonContent = covertOutputToJSON(output);

                const info = JSON.parse(jsonContent) as ProxyInfo;
                const portStr = '' + port;

                if (checkProxyInfo(info, portStr)) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch (e) {
                if (stdout.toString().length > 0) {
                    // has output but can not parse
                    resolve(false);
                } else {
                    reject(e);
                }
            }
        });
    });
}

export async function setSystemProxy(port: number) {
    logger.info('try to set system proxy', PROXY_CONF_HELPER_PATH);
    if (port === 0) {
        if (SYSTEM_IS_MACOS) {
            execSync(`'${PROXY_CONF_HELPER_PATH}' -m off`);
        } else {
            return globalProxy
                .disable()
                .then(stdout => {
                    console.log(stdout);
                    execSync(PROXY_REFRESH_WINDOWS_HELPER_PATH);
                })
                .catch(error => {
                    console.log(error);
                });
        }
        return;
    }
    if (SYSTEM_IS_MACOS) {
        const output = execSync(`'${PROXY_CONF_HELPER_PATH}' -m global -p ${port} -r ${port} -s 127.0.0.1`);
        logger.info('stdout', output.toString());
    } else {
        return globalProxy
            .enable('127.0.0.1', port, 'http')
            .then(stdout => {
                console.log(stdout);
                execSync(PROXY_REFRESH_WINDOWS_HELPER_PATH);
            })
            .catch(error => {
                console.log(error);
            });
    }
}

export async function hideOrQuit() {
    if (SYSTEM_IS_MACOS) {
        app.hide();
    } else {
        app.quit();
    }
}
