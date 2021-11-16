import React, { useEffect, useState, useRef, useMemo } from 'react';
import { StatusBar } from '../status-bar';
import { getAllExtensions } from '../../extensions';

import { Icon } from 'antd';

import classnames from 'classnames';

import { useTranslation } from 'react-i18next';
import { Provider, KeepAlive } from 'react-keep-alive';

// @ts-ignore
import { Titlebar } from 'react-titlebar-osx';
import { remote } from 'electron';
import { SYSTEM_IS_MACOS } from '../../const';
import { CoreAPI } from '../../core-api';

import darkTheme from '../../style/theme/dark.lazy.less';
import defaultTheme from '../../style/theme/default.lazy.less';

export const AppContext = React.createContext({
    isDarkMode: false,
});

export const App = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [statusRightItems, setStatusRightItems] = useState([] as Function[]);
    const [panelItems, setPanelItems] = useState([] as Function[]);
    const [panelIcons, setPanelIcons] = useState([] as string[]);
    const [panelTitles, setPanelTitles] = useState([] as string[]);
    const [selectedPanelIndex, setSelectedPanelIndex] = useState(0);

    const statusRightItemsRef = useRef(statusRightItems);

    const { t } = useTranslation();

    useEffect(() => {
        // use and unuse api is from https://webpack.js.org/loaders/style-loader/#lazystyletag
        defaultTheme.use();
        function setDarkMode(isDarkMode: boolean) {
            setIsDarkMode(isDarkMode);
            if (isDarkMode) {
                darkTheme.use();
                defaultTheme.unuse();
            } else {
                defaultTheme.use();
                darkTheme.unuse();
            }
        }
        CoreAPI.checkDarkMode(setDarkMode);
    }, []);

    useEffect(() => {
        const exntesions = getAllExtensions();
        const items = [];
        const icons = [] as string[];
        const nextPanelItems = [] as Function[];
        const titles = [] as string[];

        for (const ext of exntesions) {
            const rightStatusItem = ext.statusbarRightComponent();
            const panelComponent = ext.panelComponent();
            if (rightStatusItem) {
                items.push(rightStatusItem);
            }
            if (panelComponent) {
                if (ext.keepAlive()) {
                    const PanelComponent = panelComponent;
                    nextPanelItems.push(() => (
                        <KeepAlive name={ext.name()}>
                            <PanelComponent />
                        </KeepAlive>
                    ));
                } else {
                    nextPanelItems.push(panelComponent);
                }
                icons.push(ext.panelIcon());
                titles.push(ext.panelTitle());
            }
        }
        setStatusRightItems(statusRightItemsRef.current.concat(items));
        setPanelIcons(icons);
        setPanelItems(nextPanelItems);
        setPanelTitles(titles);
    }, []);

    const onClickItemBuilder = useMemo(() => {
        return (index: number) => () => {
            window.location.hash = `${index}`;
            setSelectedPanelIndex(index);
        };
    }, []);

    const Panel = panelItems[selectedPanelIndex];

    const handleClose = () => {
        remote.getCurrentWindow().hide();
    };

    const handleMaximize = () => {
        remote.getCurrentWindow().maximize();
    };

    const handleFullscreen = () => {
        remote.getCurrentWindow().setFullScreen(!remote.getCurrentWindow().isFullScreen());
    };

    const handleMinimize = () => {
        remote.getCurrentWindow().minimize();
    };

    return (
        <AppContext.Provider
            value={{
                isDarkMode,
            }}
        >
            <div className="lightproxy-app-container">
                <Provider>
                    {SYSTEM_IS_MACOS ? (
                        <Titlebar
                            text="LightProxy"
                            onClose={() => handleClose()}
                            onMaximize={() => handleMaximize()}
                            onFullscreen={() => handleFullscreen()}
                            onMinimize={() => handleMinimize()}
                            padding={5}
                            transparent={true}
                            draggable={true}
                        />
                    ) : null}

                    <div className="lightproxy-panel-dock no-drag">
                        {panelIcons.map((item, index) => {
                            const className = classnames({
                                'lightproxy-dock-item': true,
                                selected: index === selectedPanelIndex,
                            });

                            return (
                                <div className={className} onClick={onClickItemBuilder(index)} key={index}>
                                    <Icon style={{ fontSize: '22px' }} type={item}></Icon>
                                    <span className="lightproxy-dock-title">{t(panelTitles[index])}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="lightproxy-panel-container drag">{Panel ? <Panel /> : null}</div>
                    <StatusBar rightItems={statusRightItems} />
                </Provider>
            </div>
        </AppContext.Provider>
    );
};
