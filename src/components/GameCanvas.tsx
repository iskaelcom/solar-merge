import React, { useMemo } from 'react';
import {
    Canvas,
    Image,
    Group,
    useImage,
    vec,
    useTouchHandler,
    Rect,
    Circle,
    RadialGradient,
    Path,
    Line
} from '@shopify/react-native-skia';
import {
    GAME_WIDTH,
    GAME_HEIGHT,
    PLANETS,
    DANGER_HEIGHT,
    STAR_RADIUS,
    BLACK_HOLE_RADIUS,
    VIRUS_RADIUS
} from '../constants';
import { GameState } from '../types';

interface GameCanvasProps {
    state: GameState;
    width: number;
    height: number;
    onPointerMove: (x: number) => void;
    onPointerUp: (x: number) => void;
}

const SATURN_ID = 8;

const PLANET_IMAGES_MAP: Record<number, any> = {
    1: require('../../assets/planets/moon.png'),
    2: require('../../assets/planets/mercury.png'),
    3: require('../../assets/planets/mars.png'),
    4: require('../../assets/planets/venus.png'),
    5: require('../../assets/planets/earth.png'),
    6: require('../../assets/planets/neptune.png'),
    7: require('../../assets/planets/uranus.png'),
    8: require('../../assets/planets/saturn.png'),
    9: require('../../assets/planets/jupiter.png'),
    10: require('../../assets/planets/sun.png'),
};

const SICK_PLANET_IMAGES_MAP: Record<number, any> = {
    1: require('../../assets/planets/moon-sick.png'),
    2: require('../../assets/planets/mercury-sick.png'),
    3: require('../../assets/planets/mars-sick.png'),
    4: require('../../assets/planets/venus-sick.png'),
    5: require('../../assets/planets/earth-sick.png'),
    6: require('../../assets/planets/neptune-sick.png'),
    7: require('../../assets/planets/uranus-sick.png'),
    8: require('../../assets/planets/saturn-sick.png'),
    9: require('../../assets/planets/jupiter-sick.png'),
    10: require('../../assets/planets/sun-sick.png'),
};

export const GameCanvas: React.FC<GameCanvasProps> = ({ state, width, height, onPointerMove, onPointerUp }) => {
    // Planets
    const p1 = useImage(PLANET_IMAGES_MAP[1]);
    const p2 = useImage(PLANET_IMAGES_MAP[2]);
    const p3 = useImage(PLANET_IMAGES_MAP[3]);
    const p4 = useImage(PLANET_IMAGES_MAP[4]);
    const p5 = useImage(PLANET_IMAGES_MAP[5]);
    const p6 = useImage(PLANET_IMAGES_MAP[6]);
    const p7 = useImage(PLANET_IMAGES_MAP[7]);
    const p8 = useImage(PLANET_IMAGES_MAP[8]);
    const p9 = useImage(PLANET_IMAGES_MAP[9]);
    const p10 = useImage(PLANET_IMAGES_MAP[10]);

    // Sick Planets
    const ps1 = useImage(SICK_PLANET_IMAGES_MAP[1]);
    const ps2 = useImage(SICK_PLANET_IMAGES_MAP[2]);
    const ps3 = useImage(SICK_PLANET_IMAGES_MAP[3]);
    const ps4 = useImage(SICK_PLANET_IMAGES_MAP[4]);
    const ps5 = useImage(SICK_PLANET_IMAGES_MAP[5]);
    const ps6 = useImage(SICK_PLANET_IMAGES_MAP[6]);
    const ps7 = useImage(SICK_PLANET_IMAGES_MAP[7]);
    const ps8 = useImage(SICK_PLANET_IMAGES_MAP[8]);
    const ps9 = useImage(SICK_PLANET_IMAGES_MAP[9]);
    const ps10 = useImage(SICK_PLANET_IMAGES_MAP[10]);

    const images = useMemo(() => ({
        normal: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10],
        sick: [ps1, ps2, ps3, ps4, ps5, ps6, ps7, ps8, ps9, ps10]
    }), [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, ps1, ps2, ps3, ps4, ps5, ps6, ps7, ps8, ps9, ps10]);

    const touchHandler = useTouchHandler({
        onStart: (pt) => onPointerMove(pt.x),
        onActive: (pt) => onPointerMove(pt.x),
        onEnd: (pt) => onPointerUp(pt.x),
    });

    const sickSet = useMemo(() => new Set(state.sickPlanetIds), [state.sickPlanetIds]);

    // Star path helper
    const starPath = useMemo(() => {
        const outerR = STAR_RADIUS + 2;
        const innerR = outerR * 0.42;
        let d = "";
        for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i * 36 - 90) * (Math.PI / 180);
            const x = r * Math.cos(angle);
            const y = r * Math.sin(angle);
            if (i === 0) d += `M ${x},${y}`;
            else d += ` L ${x},${y}`;
        }
        d += " Z";
        return d;
    }, []);

    return (
        <Canvas style={{ width: width, height: height }} onTouch={touchHandler}>
            {/* Background */}
            <Rect x={0} y={0} width={width} height={height} color="#0d0221" />

            {/* Danger Line */}
            <Rect x={0} y={DANGER_HEIGHT} width={width} height={2} color="rgba(255, 0, 0, 0.3)" />

            {/* Planets */}
            {state.planets.map((p) => {
                const isSick = sickSet.has(p.id);
                const img = isSick ? images.sick[p.planetId - 1] : images.normal[p.planetId - 1];
                if (!img) return null;

                const planetData = PLANETS[p.planetId - 1];
                const isSaturn = p.planetId === SATURN_ID;
                const width = isSaturn ? planetData.size * 4 : planetData.size * 2;
                const height = planetData.size * 2;

                return (
                    <Group
                        key={p.id}
                        origin={vec(p.x, p.y)}
                        transform={[{ rotate: p.angle }]}
                    >
                        <Image
                            image={img}
                            x={p.x - width / 2}
                            y={p.y - height / 2}
                            width={width}
                            height={height}
                        />
                        {isSick && (
                            <Circle cx={p.x} cy={p.y} r={planetData.size + 5} color="rgba(170, 0, 255, 0.3)" strokeWidth={3} style="stroke" />
                        )}
                    </Group>
                );
            })}

            {/* Stars */}
            {state.stars.map((s) => (
                <Group key={s.id} transform={[{ translateX: s.x }, { translateY: s.y }, { rotate: s.angle }]}>
                    <Path path={starPath} color="#FFD600" style="fill" />
                    <Path path={starPath} color="#FFFDE7" style="stroke" strokeWidth={1.5} />
                </Group>
            ))}

            {/* Black Holes */}
            {state.blackHoles.map((bh) => (
                <Group key={bh.id}>
                    <Circle cx={bh.x} cy={bh.y} r={BLACK_HOLE_RADIUS * 1.25}>
                        <RadialGradient
                            c={vec(bh.x, bh.y)}
                            r={BLACK_HOLE_RADIUS * 1.25}
                            colors={["#000000", "#1a003a", "#5500aa", "transparent"]}
                            positions={[0, 0.38, 0.8, 1]}
                        />
                    </Circle>
                    <Circle cx={bh.x} cy={bh.y} r={BLACK_HOLE_RADIUS * 0.4} color="black" />
                </Group>
            ))}

            {/* Viruses */}
            {state.viruses.map((v) => (
                <Group key={v.id}>
                    <Circle cx={v.x} cy={v.y} r={VIRUS_RADIUS} color="#1B5E20">
                        <RadialGradient
                            c={vec(v.x, v.y)}
                            r={VIRUS_RADIUS}
                            colors={["#E6FF4D", "#76C442", "#1B5E20"]}
                        />
                    </Circle>
                    {/* Simple spikes */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                        <Line
                            key={angle}
                            p1={vec(v.x, v.y)}
                            p2={vec(v.x + VIRUS_RADIUS * 1.3 * Math.cos(angle * Math.PI / 180), v.y + VIRUS_RADIUS * 1.3 * Math.sin(angle * Math.PI / 180))}
                            color="#33691E"
                            strokeWidth={2}
                        />
                    ))}
                </Group>
            ))}

            {/* Pointer/Guide Planet */}
            {!state.gameOver && !state.isDropping && (
                <Group opacity={0.6}>
                    {state.currentIsStar ? (
                        <Group transform={[{ translateX: state.pointerX }, { translateY: STAR_RADIUS + 2 }]}>
                            <Path path={starPath} color="#FFD600" style="fill" />
                        </Group>
                    ) : state.currentIsBlackHole ? (
                        <Circle cx={state.pointerX} cy={BLACK_HOLE_RADIUS + 2} r={BLACK_HOLE_RADIUS} color="#5500aa" />
                    ) : state.currentIsVirus ? (
                        <Circle cx={state.pointerX} cy={VIRUS_RADIUS + 2} r={VIRUS_RADIUS} color="#76C442" />
                    ) : (
                        images.normal[state.currentPlanetId - 1] && (
                            <Image
                                image={images.normal[state.currentPlanetId - 1]!}
                                x={state.pointerX - (state.currentPlanetId === SATURN_ID ? PLANETS[state.currentPlanetId - 1].size * 2 : PLANETS[state.currentPlanetId - 1].size)}
                                y={2}
                                width={state.currentPlanetId === SATURN_ID ? PLANETS[state.currentPlanetId - 1].size * 4 : PLANETS[state.currentPlanetId - 1].size * 2}
                                height={PLANETS[state.currentPlanetId - 1].size * 2}
                            />
                        )
                    )}
                </Group>
            )}

            {/* Explosions */}
            {state.explosions.map((exp) => (
                <Group key={exp.id}>
                    {exp.particles.map((p, i) => (
                        <Circle
                            key={`${exp.id}_${i}`}
                            cx={p.x}
                            cy={p.y}
                            r={p.size}
                            color={p.color}
                        />
                    ))}
                </Group>
            ))}
        </Canvas>
    );
};
