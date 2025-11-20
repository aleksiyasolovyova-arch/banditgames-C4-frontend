// src/components/GameInfo.tsx (updated)
import { Box, Typography, Chip } from "@mui/material";

export default function GameInfo({ state }: { state: any }) {
    const isPlayer1Turn = state.current_player === "player1";

    return (
        <Box className={`enhanced-game-info ${isPlayer1Turn ? 'player1-turn' : 'player2-turn'}`}>
            <Typography variant="h6" className="current-player">
                Current Turn:
            </Typography>
            <div className={`player-indicator ${isPlayer1Turn ? 'player1-indicator' : 'player2-indicator'}`}>
                <div
                    style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: isPlayer1Turn ? '#ff5252' : '#ffee58'
                    }}
                />
                {state.current_player.toUpperCase()}
            </div>

            {state.status !== "in_progress" && (
                <Chip
                    color={state.status === "win" ? "success" : "warning"}
                    label={
                        state.status === "win"
                            ? `Winner: ${state.winner}`
                            : "Draw"
                    }
                    sx={{ mt: 2, fontWeight: 'bold' }}
                />
            )}
        </Box>
    );
}