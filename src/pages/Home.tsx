// src/pages/Home.tsx
import { Typography, Box } from "@mui/material";

export default function Home() {
    return (
        <div className="home-container">
            <div className="home-card">
                <Typography variant="h1" className="home-title">
                    Connect 4
                </Typography>

                <Typography variant="h6" className="home-subtitle">
                    Game Service Active
                </Typography>

                <Box sx={{ my: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="body1">
                        This interface is designed to be used via the <b>Platform</b>.
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Please initiate a game from the main dashboard.
                        You will be redirected here with a Game ID.
                    </Typography>
                </Box>

                <Typography variant="caption" display="block" color="text.disabled">
                    System Ready • Waiting for Game ID
                </Typography>
            </div>
        </div>
    );
}