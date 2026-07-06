// Simple Express server for Soccer Pickup FIFA

const express = require('express');

const cors = require('cors');

const path = require('path');

const db = require('./database/db');

 

const app = express();

const PORT = process.env.PORT || 3000;

 

// CORS configuration - allows requests from Netlify frontend

const corsOptions = {

    origin: process.env.FRONTEND_URL || '*',  // Will be set in Railway

    credentials: true,

    optionsSuccessStatus: 200

};

 

// Middleware

app.use(cors(corsOptions));

app.use(express.json());

app.use(express.static(path.join(__dirname, 'frontend')));

 

// ==================== PLAYERS API ====================

 

// Get all players

app.get('/api/players', async (req, res) => {

    try {

        const result = await db.query(`

            SELECT p.*,

                   ps.pace, ps.shooting, ps.passing, ps.dribbling, ps.defending, ps.physical, ps.vote_count

            FROM players p

            LEFT JOIN player_stats ps ON p.id = ps.player_id

            ORDER BY p.created_at DESC

        `);

       

        const players = result.rows.map(row => ({

            id: row.id,

            name: row.name,

            imageUrl: row.image_url,

            primaryPosition: row.primary_position,

            rarity: row.rarity,

            stats: {

                pace: row.pace || 50,

                shooting: row.shooting || 50,

                passing: row.passing || 50,

                dribbling: row.dribbling || 50,

                defending: row.defending || 50,

                physical: row.physical || 50,

                voteCount: row.vote_count || 0

            },

            createdAt: row.created_at

        }));

       

        res.json(players);

    } catch (error) {

        console.error('Error fetching players:', error);

        res.status(500).json({ error: 'Failed to fetch players' });

    }

});

 

// Add new player

app.post('/api/players', async (req, res) => {

    try {

        const { id, name, imageUrl, primaryPosition, rarity } = req.body;

       

        if (!id || !name || !primaryPosition) {

            return res.status(400).json({ error: 'Missing required fields' });

        }

       

        // Insert player

        await db.query(

            'INSERT INTO players (id, name, image_url, primary_position, rarity) VALUES ($1, $2, $3, $4, $5)',

            [id, name, imageUrl || null, primaryPosition, rarity || 'gold']

        );

       

        // Insert default stats

        await db.query(

            'INSERT INTO player_stats (player_id) VALUES ($1)',

            [id]

        );

       

        // Fetch the created player

        const result = await db.query(`

            SELECT p.*,

                   ps.pace, ps.shooting, ps.passing, ps.dribbling, ps.defending, ps.physical, ps.vote_count

            FROM players p

            LEFT JOIN player_stats ps ON p.id = ps.player_id

            WHERE p.id = $1

        `, [id]);

       

        const player = result.rows[0];

        res.json({

            id: player.id,

            name: player.name,

            imageUrl: player.image_url,

            primaryPosition: player.primary_position,

            rarity: player.rarity,

            stats: {

                pace: player.pace,

                shooting: player.shooting,

                passing: player.passing,

                dribbling: player.dribbling,

                defending: player.defending,

                physical: player.physical,

                voteCount: player.vote_count

            }

        });

    } catch (error) {

        console.error('Error adding player:', error);

        if (error.code === '23505') { // Unique violation

            res.status(400).json({ error: 'Player name already exists' });

        } else {

            res.status(500).json({ error: 'Failed to add player' });

        }

    }

});

 

// ==================== STATS VOTING API ====================

 

// Submit vote

app.post('/api/stats/vote', async (req, res) => {

    try {

        const { id, voterId, playerId, pace, shooting, passing, dribbling, defending, physical } = req.body;

       

        if (!voterId || !playerId) {

            return res.status(400).json({ error: 'Missing required fields' });

        }

       

        // Upsert vote (insert or update if exists)

        await db.query(`

            INSERT INTO stat_votes (id, voter_id, player_id, pace, shooting, passing, dribbling, defending, physical)

            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)

            ON CONFLICT (voter_id, player_id)

            DO UPDATE SET

                pace = $4, shooting = $5, passing = $6,

                dribbling = $7, defending = $8, physical = $9,

                created_at = CURRENT_TIMESTAMP

        `, [id, voterId, playerId, pace, shooting, passing, dribbling, defending, physical]);

       

        // Stats are automatically updated by trigger

        res.json({ success: true });

    } catch (error) {

        console.error('Error submitting vote:', error);

        res.status(500).json({ error: 'Failed to submit vote' });

    }

});

 

// ==================== TEAMS API ====================

 

// Get all teams

app.get('/api/teams', async (req, res) => {

    try {

        const result = await db.query(`

            SELECT t.id, t.name, t.color, t.created_at,

                   json_agg(

                       json_build_object(

                           'id', p.id,

                           'name', p.name,

                           'primaryPosition', p.primary_position,

                           'stats', json_build_object(

                               'pace', ps.pace,

                               'shooting', ps.shooting,

                               'passing', ps.passing,

                               'dribbling', ps.dribbling,

                               'defending', ps.defending,

                               'physical', ps.physical

                           )

                       )

                   ) FILTER (WHERE p.id IS NOT NULL) as players

            FROM teams t

            LEFT JOIN team_members tm ON t.id = tm.team_id

            LEFT JOIN players p ON tm.player_id = p.id

            LEFT JOIN player_stats ps ON p.id = ps.player_id

            GROUP BY t.id

            ORDER BY t.created_at DESC

        `);

       

        res.json(result.rows);

    } catch (error) {

        console.error('Error fetching teams:', error);

        res.status(500).json({ error: 'Failed to fetch teams' });

    }

});

 

// Create team

app.post('/api/teams', async (req, res) => {

    try {

        const { id, name, color, playerIds } = req.body;

       

        if (!id || !name) {

            return res.status(400).json({ error: 'Missing required fields' });

        }

       

        const client = await db.getClient();

       

        try {

            await client.query('BEGIN');

           

            // Insert team

            await client.query(

                'INSERT INTO teams (id, name, color) VALUES ($1, $2, $3)',

                [id, name, color || '#3b82f6']

            );

           

            // Insert team members

            if (playerIds && playerIds.length > 0) {

                for (const playerId of playerIds) {

                    const memberId = 'member_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

                    await client.query(

                        'INSERT INTO team_members (id, team_id, player_id) VALUES ($1, $2, $3)',

                        [memberId, id, playerId]

                    );

                }

            }

           

            await client.query('COMMIT');

            res.json({ success: true, id });

        } catch (error) {

            await client.query('ROLLBACK');

            throw error;

        } finally {

            client.release();

        }

    } catch (error) {

        console.error('Error creating team:', error);

        res.status(500).json({ error: 'Failed to create team' });

    }

});

 

// Delete team

app.delete('/api/teams/:id', async (req, res) => {

    try {

        await db.query('DELETE FROM teams WHERE id = $1', [req.params.id]);

        res.json({ success: true });

    } catch (error) {

        console.error('Error deleting team:', error);

        res.status(500).json({ error: 'Failed to delete team' });

    }

});

 

// ==================== POLLS API ====================

 

// Get all polls

app.get('/api/polls', async (req, res) => {

    try {

        const result = await db.query(`

            SELECT p.id, p.title, p.description, p.poll_type, p.active, p.created_at,

                   json_agg(

                       json_build_object(

                           'id', po.id,

                           'text', po.option_text,

                           'votes', po.votes,

                           'voters', COALESCE(

                               (SELECT array_agg(voter_id) FROM poll_votes WHERE option_id = po.id),

                               ARRAY[]::varchar[]

                           )

                       ) ORDER BY po.created_at

                   ) as options

            FROM polls p

            LEFT JOIN poll_options po ON p.id = po.poll_id

            GROUP BY p.id

            ORDER BY p.created_at DESC

        `);

       

        res.json(result.rows);

    } catch (error) {

        console.error('Error fetching polls:', error);

        res.status(500).json({ error: 'Failed to fetch polls' });

    }

});

 

// Create poll

app.post('/api/polls', async (req, res) => {

    try {

        const { id, title, description, pollType, options } = req.body;

       

        if (!id || !title || !options || options.length < 2) {

            return res.status(400).json({ error: 'Missing required fields or insufficient options' });

        }

       

        const client = await db.getClient();

       

        try {

            await client.query('BEGIN');

           

            // Insert poll

            await client.query(

                'INSERT INTO polls (id, title, description, poll_type) VALUES ($1, $2, $3, $4)',

                [id, title, description || null, pollType || 'general']

            );

           

            // Insert options

            for (const option of options) {

                await client.query(

                    'INSERT INTO poll_options (id, poll_id, option_text) VALUES ($1, $2, $3)',

                    [option.id, id, option.text]

                );

            }

           

            await client.query('COMMIT');

            res.json({ success: true, id });

        } catch (error) {

            await client.query('ROLLBACK');

            throw error;

        } finally {

            client.release();

        }

    } catch (error) {

        console.error('Error creating poll:', error);

        res.status(500).json({ error: 'Failed to create poll' });

    }

});

 

// Vote on poll

app.post('/api/polls/:pollId/vote', async (req, res) => {

    try {

        const { pollId } = req.params;

        const { voteId, optionId, voterId } = req.body;

       

        if (!optionId || !voterId) {

            return res.status(400).json({ error: 'Missing required fields' });

        }

       

        const client = await db.getClient();

       

        try {

            await client.query('BEGIN');

           

            // Remove previous vote for this poll

            await client.query(

                'DELETE FROM poll_votes WHERE poll_id = $1 AND voter_id = $2',

                [pollId, voterId]

            );

           

            // Add new vote

            await client.query(

                'INSERT INTO poll_votes (id, poll_id, option_id, voter_id) VALUES ($1, $2, $3, $4)',

                [voteId, pollId, optionId, voterId]

            );

           

            await client.query('COMMIT');

            res.json({ success: true });

        } catch (error) {

            await client.query('ROLLBACK');

            throw error;

        } finally {

            client.release();

        }

    } catch (error) {

        console.error('Error voting on poll:', error);

        res.status(500).json({ error: 'Failed to vote' });

    }

});

 

// Delete poll

app.delete('/api/polls/:id', async (req, res) => {

    try {

        await db.query('DELETE FROM polls WHERE id = $1', [req.params.id]);

        res.json({ success: true });

    } catch (error) {

        console.error('Error deleting poll:', error);

        res.status(500).json({ error: 'Failed to delete poll' });

    }

});

 

// ==================== HEALTH CHECK ====================

 

app.get('/api/health', async (req, res) => {

    try {

        await db.query('SELECT 1');

        res.json({ status: 'ok', database: 'connected' });

    } catch (error) {

        res.status(500).json({ status: 'error', database: 'disconnected' });

    }

});

 

// ==================== START SERVER ====================

 

app.listen(PORT, () => {

    console.log(`

    ⚽ Soccer Pickup FIFA Server

    🚀 Server running on http://localhost:${PORT}

    📊 API available at http://localhost:${PORT}/api

    🏥 Health check: http://localhost:${PORT}/api/health

    `);

});

 

// Handle graceful shutdown

process.on('SIGTERM', () => {

    console.log('SIGTERM signal received: closing HTTP server');

    server.close(() => {

        console.log('HTTP server closed');

    });

});