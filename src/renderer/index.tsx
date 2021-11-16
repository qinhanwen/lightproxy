// Initial welcome page. Delete the following line to remove it.
import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { remote } from 'electron';
import * as monaco from '@timkendrick/monaco-editor/dist/external';
import '@timkendrick/monaco-editor/dist/external/monaco.css';
import 'reset-css';

import { App } from './components/app';
import { i18nResources } from './i18n';

// @ts-ignore
window.monaco = monaco;

// make links open in external browser, for example monaco
// @ts-ignore
window.open = function(url: string) {
    if (url) {
        remote.shell.openExternal(url);
    } else {
        // tab = window.open()
        // tab.location.href = '';
        // hack for this
        return {
            location: {
                set href(url: string) {
                    remote.shell.openExternal(url);
                },
                get href() {
                    return '';
                },
            },
        };
    }
};

i18n.use(initReactI18next) // passes i18n down to react-i18next
    .init({
        resources: i18nResources,
        lng: navigator.language,
        fallbackLng: 'en',

        interpolation: {
            escapeValue: false,
        },
    });

ReactDOM.render(
    <AppContainer>
        <App />
    </AppContainer>,
    document.getElementById('app'),
);

window.onkeydown = function(e: any) {
    const ev: any = window.event || e;
    const code = ev.keyCode || ev.which;
    if (code == 82 && (ev.metaKey || ev.ctrlKey)) {
        return false;
    }
};
