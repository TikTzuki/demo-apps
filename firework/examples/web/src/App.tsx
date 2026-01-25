import {useState} from 'react';
import {applyPlugin, FireworkCanvas} from '@tiktuzki/firework';
import './App.css';
import {randomPlugin} from "../../src/plugins";
import {HappyNewYear} from "./HappyNewYear";


function App() {
    return (
        <div className="app">
            <header className="header">
                <h1>🎆 Happy new year 🎆</h1>
                <p className="subtitle"> Tết này pháo hoa tưng bừng</p>
            </header>

            <div className="container">
                {/* Children Demo Section */}
                <section className="demo-section">
                    <div className="canvas-container">
                        <FireworkCanvas
                            autoLaunch={true}
                            launchInterval={1500}
                            config={applyPlugin(randomPlugin)}
                        >
                            <HappyNewYear/>
                        </FireworkCanvas>
                    </div>
                </section>

            </div>

            <footer className="footer">
                <p>Made by tiktuzki</p>
            </footer>
        </div>
    );
}

export default App;
