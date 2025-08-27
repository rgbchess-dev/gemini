/*
 * Traxler Counter-Attack Data Module
 */

export const traxlerData = {
    theory: {
        name: "Traxler Theory Lines",
        playerColor: 'black',
        orientation: 'black',
        lines: [
            {
                name: "Line 1: Kxf2 Main (Kf3)",
                moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "Bc5", "Nxf7", "Bxf2+", "Kxf2", "Nxe4+", "Kf3", "Qf6+", "Kxe4", "d5+", "Bxd5", "Qf4+", "Kd3", "Qd4+", "Ke2", "Qxd5", "Kf1", "Qxf7+"]
            },
            {
                name: "Line 1.1: Kxf2 | Ke1",
                moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "Bc5", "Nxf7", "Bxf2+", "Kxf2", "Nxe4+", "Ke1", "Qh4+", "g3", "Nxg3", "hxg3", "Qxh1+", "Bf1", "O-O"]
            },
            {
                name: "Line 1.2: Kxf2 | Kf1", 
                moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "Bc5", "Nxf7", "Bxf2+", "Kxf2", "Nxe4+", "Kf1", "Qh4", "Qf3", "Nd4", "g3", "Qh3+", "Qg2", "d5", "Bxd5", "Qf5+", "Ke1", "Nxc2+"]
            },
            {
                name: "Line 1.3: King Hunt (Ke2)",
                moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "Bc5", "Nxf7", "Bxf2+", "Kxf2", "Nxe4+", "Ke2", "Nd4+", "Ke3", "Qh4", "g3", "Nxg3", "hxg3", "Qxg3+", "Ke4", "d5+", "Kxd5", "c6+", "Kd6", "Nf5+", "Kc5", "b6+", "Kb4", "a5+", "Ka4", "b5+", "Bxb5", "cxb5+", "Kxb5", "Bd7+", "Kc5", "Rc8+", "Kb6", "Qg6+", "Nd6+", "Qxd6+", "Ka7", "Qc7+", "Ka6", "Ra8#"]
            },
            {
                name: "Line 1.4: Kxf2 | Ke3",
                moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "Bc5", "Nxf7", "Bxf2+", "Kxf2", "Nxe4+", "Ke3", "Qh4", "g3", "Nxg3", "hxg3", "Qd4+", "Ke2", "Qxc4+"]
            },
            {
                name: "Line 2: Kf1 Variation",
                moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "Bc5", "Nxf7", "Bxf2+", "Kf1", "Qe7", "Nxh8", "d5", "exd5", "Nd4", "c3", "Bg4", "Qa4+", "Nd7", "cxd4", "Qf6", "dxe5", "Qf4", "g3", "Bxg3+", "Kg2", "Qf2#"]
            },
            {
                name: "Line 3: Bxf7+ Bishop Sacrifice",
                moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "Bc5", "Bxf7+", "Ke7", "Bb3", "Rf8", "Nc3", "Qe8", "O-O", "d6", "d3", "Qg6", "Nf3", "Bg4", "Bd2", "Nd4"]
            }
        ]
    },
        exercises: {
        name: "Tactical Exercises",
        playerColor: 'black',
        orientation: 'black',
        lines: [
            {
                name: "Exercise 1: Find the Mate in 2",
                description: "White just played 8.Ke2. Black to move and mate in 2!",
                fen: "r1b1k2r/pppp1Npp/2n5/4p3/2B1n2q/8/PPPPK1PP/RNBQ3R b kq - 3 8",
                moves: ["Qf2+", "Kd3", "Nb4+", "Kxe4", "Qf4#"],
                hint: "The white king is caught in the center - use your pieces to deliver mate!"
            },
            {
                name: "Exercise 2: Punish the Blunder", 
                description: "White blundered with 9.Nxh8. Black to move and mate in 3!",
                fen: "r1b1k2N/pppp2pp/2n5/4p3/2B4q/6n1/PPPP3P/RNBQK2R b q - 0 9",
                moves: ["Ne4+", "Ke2", "Qf2+", "Kd3", "Nb4+", "Kxe4", "Qf4#"],
                hint: "The knight on h8 is out of play - attack the exposed king!"
            },
            {
                name: "Exercise 3: Win the Queen",
                description: "White played 10.Ke2 instead of 10.Bf1. Black to move and win material!",
                fen: "r1b1k2r/pppp1Npp/2n5/4p3/2B5/6P1/PPPPK3/RNBQ3q b kq - 1 10", 
                moves: ["Nd4+", "Kd3", "Qxd1"],
                hint: "The white king is undefended - fork king and queen!"
            },
            {
                name: "Exercise 4: King Hunt Continues",
                description: "After 12.Kxd5. Continue the famous king hunt!",
                fen: "r1b1k2r/ppp2Npp/8/3Kp3/2Bn4/6q1/PPPP4/RNBQ3R b kq - 0 12",
                moves: ["c6+", "Kd6", "Nf5+", "Kc5", "b6+"],
                hint: "The king hunt continues - keep checking and driving the king forward!"
            },
            {
                name: "Exercise 5: Beautiful Bishop Sacrifice",
                description: "In the Kf1 line, White just played 13.g3. Find the beautiful finish!",
                fen: "r3k2N/pppn2pp/8/3PP3/Q1B2qb1/6P1/PP1P1b1P/RNB2K1R b q - 0 13",
                moves: ["Bxg3+", "Kg1", "Qf2#"],
                hint: "Sacrifice the bishop to open the king - mate follows immediately!"
            },
            {
                name: "Exercise 6: Counter the Bishop Sacrifice",
                description: "White played 5.Bxf7+. How should Black continue the counterplay?",
                fen: "r1bqk2r/pppp1Bpp/2n2n2/2b1p1N1/4P3/8/PPPP1PPP/RNBQK2R b KQkq - 0 5",
                moves: ["Ke7", "Bb3", "Rf8"],
                hint: "Accept the sacrifice and develop aggressively - attack the knight!"
            }
        ]
    }
};