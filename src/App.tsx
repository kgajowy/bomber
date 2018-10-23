import * as React from 'react'
import { Bomb } from './game/bomber/bomb/Bomb'
import { Explosion } from './game/bomber/bomb/Explosion'
import { Bucket } from './game/bomber/bucket/Bucket'
import { Hands } from './game/bomber/hands/Hands'
import { Life } from './game/bomber/life/Life'
import {
    bombCatch,
    bombOutOfBounds,
    bombs as bombsMovement,
    bombSpawn,
    crossesMovements,
    hands as handsMovements,
    levelProgress
} from './game/bomber/rules'
import Game from './game/Game'
import { Campaign } from './game/levels/campaign'
import { ILevel } from './game/levels/level'
import { IRunningLevel, prepareLevel } from './game/levels/util'
import { ISprite } from './game/util/sprite'
import { PlayButton } from './menu/PlayButton'


export interface IGameState {
    running: boolean,
    time: number,
    gameTime: number,
    deltaTime: number,
    bucket: ISprite,
    hands: ISprite,
    bombs: ISprite[],
    crosses: ISprite[],
    lives: number,
    settings: {
        width: number,
        height: number,
    },
    levels: ILevel[],
    level: IRunningLevel | undefined,
    won: boolean,
    debug: {
        collisions: boolean,
    }
}

class App extends React.Component<{}, IGameState> {

    private requestId: number

    private rules: any[] = []

    public constructor(props: {}) {
        super(props)

        this.state = {
            running: true,
            time: 0,
            gameTime: 0,
            deltaTime: 0,
            settings: {
                width: 700,
                height: 500,
            },
            lives: 5,
            hands: {
                x: 350,
                y: 100,
                w: 60,
                h: 60,
            },
            bucket: {
                x: 350,
                y: 450,
                w: 48,
                h: 48,
            },
            bombs: [],
            crosses: [],
            levels: Campaign.levels,
            level: undefined,
            won: false,
            debug: {
                collisions: true,
            }
        }
    }

    public componentWillUnmount() {
        cancelAnimationFrame(this.requestId)
        document.removeEventListener('keydown', this.onKeyDown)
        document.removeEventListener('mousemove', this.onMouseMove)
    }

    public componentDidMount() {
        document.addEventListener('keydown', this.onKeyDown)
        document.addEventListener('mousemove', this.onMouseMove)

        let scheduleNextTick: () => void
        const tick = (time: number) => {
            const deltaTime = time - this.state.time
            const newStateBase: IGameState = {
                ...this.state,
                time,
                deltaTime,
                gameTime: this.state.gameTime + deltaTime
            }
            const newState: IGameState = this.rules.reduce((acc, rule) => ({
                ...acc,
                ...rule(acc)
            }), newStateBase)

            if (newState.lives === 0) {
                this.stopGame()
            }

            this.setState(newState,
                scheduleNextTick,
            )
        }
        scheduleNextTick = () => {
            this.requestId = requestAnimationFrame(tick)
        }
        scheduleNextTick()

        this.newGame()
    }

    // TODO background & misc graphics ?
    // TODO scores
    // TODO bonuses types & sprites
    // TODO bonuses collisions
    // TODO bonuses timing & factors
    // TODO 10 levels
    // TODO menu

    // TODO v.1.1
    // TODO user levels (cpy paste)
    // TODO contributors levels

    public onMouseMove = ({ screenX }: MouseEvent): void => {
        this.setState({
            bucket: {
                ...this.state.bucket,
                x: screenX,
            }
        })
    }

    public newGame = (): void => {
        this.rules = [
            bombsMovement, bombSpawn, handsMovements, bombOutOfBounds, crossesMovements, bombCatch, levelProgress
        ]
        const [ firstLevel, ...rest ] = Campaign.levels
        this.setState({
            lives: 5,
            bombs: [],
            crosses: [],
            gameTime: 0,
            deltaTime: 0,
            level: prepareLevel(firstLevel),
            levels: rest,
        })

    }

    public render() {
        const { hands, bucket, bombs, crosses, lives, settings, level = { ref: { name: 'Game' }}, debug } = this.state
        return (
            <div>
                <Game width={settings.width} height={settings.height} backgroundColor={'yellow'}>
                    <Hands {...hands} debug={debug.collisions}/>
                    {bombs.map((b, i) => <Bomb {...b} key={i} debug={debug.collisions}/>)}
                    {crosses.map((c, i) => <Explosion {...c} key={i}/>)}
                    {  new Array(lives).fill(0).map((_, i) => <Life y={20} x={settings.width - (i + 1) * 36} w={32} h={32} key={i}/>) }
                    {<text x="20" y="30">{level.ref.name}</text>}
                    <Bucket {...bucket} debug={debug.collisions}/>
                </Game>
                {lives === 0 &&
                <div style={{
                    position: 'absolute',
                    top: window.innerHeight / 2,
                    left: 0,
                    width: settings.width,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    textAlign: 'center',
                }}>
                    <PlayButton text={'Restart?'} onClick={this.newGame}/>

                </div>
                }
            </div>
        )
    }

    private stopGame = (): void => {
        this.rules = [ bombsMovement, bombOutOfBounds, crossesMovements ] // even tho its game over, keep some moves
    }


    private onKeyDown = () => undefined

}

export default App
