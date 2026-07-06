// Soccer Pickup FIFA - Production Version

// Automatically detects API URL based on environment

 

// API URL - will be set during deployment

const API_URL = window.location.hostname === 'localhost'

    ? 'http://localhost:3000/api'  // Local development

    : 'https://YOUR-RAILWAY-APP.up.railway.app/api';  // Production - UPDATE THIS AFTER RAILWAY DEPLOYMENT

 

// User ID management

let currentUserId = localStorage.getItem('fifa_user_id');

if (!currentUserId) {

    currentUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    localStorage.setItem('fifa_user_id', currentUserId);

}

 

// API helper functions

async function apiGet(endpoint) {

    try {

        const response = await fetch(`${API_URL}${endpoint}`);

        if (!response.ok) throw new Error(`API error: ${response.statusText}`);

        return response.json();

    } catch (error) {

        console.error('API GET error:', error);

        throw error;

    }

}

 

async function apiPost(endpoint, data) {

    try {

        const response = await fetch(`${API_URL}${endpoint}`, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify(data)

        });

        if (!response.ok) throw new Error(`API error: ${response.statusText}`);

        return response.json();

    } catch (error) {

        console.error('API POST error:', error);

        throw error;

    }

}

 

async function apiDelete(endpoint) {

    try {

        const response = await fetch(`${API_URL}${endpoint}`, {

            method: 'DELETE'

        });

        if (!response.ok) throw new Error(`API error: ${response.statusText}`);

        return response.json();

    } catch (error) {

        console.error('API DELETE error:', error);

        throw error;

    }

}

 

// Navigation

document.querySelectorAll('.nav-btn').forEach(btn => {

    btn.addEventListener('click', () => {

        const page = btn.getAttribute('data-page');

        showPage(page);

    });

});

 

function showPage(pageName) {

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    document.querySelectorAll('.nav-btn').forEach(n => n.classList.remove('active'));

   

    document.getElementById(pageName).classList.add('active');

    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

   

    if (pageName === 'players') renderPlayers();

    if (pageName === 'team-picker') renderTeamPicker();

    if (pageName === 'polls') renderPolls();

}

 

// Modal functions

function showModal(modalId) {

    document.getElementById(modalId).classList.add('active');

}

 

function closeModal(modalId) {

    document.getElementById(modalId).classList.remove('active');

}

 

// Utility functions

function getOverallRating(stats) {

    if (!stats) return 50;

    const sum = stats.pace + stats.shooting + stats.passing + stats.dribbling + stats.defending + stats.physical;

    return Math.round(sum / 6);

}

 

function getRarityFromRating(rating) {

    if (rating >= 90) return 'special';

    if (rating >= 80) return 'gold';

    if (rating >= 70) return 'silver';

    return 'bronze';

}

 

function getPositionColor(position) {

    const pos = position.toUpperCase();

    if (['ST', 'CF', 'LW', 'RW'].includes(pos)) return '#ff4444';

    if (['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(pos)) return '#44ff44';

    if (['CB', 'LB', 'RB'].includes(pos)) return '#4444ff';

    if (pos === 'GK') return '#ffaa00';

    return '#888888';

}

 

// PLAYERS

let currentVotePlayerId = null;

let allPlayers = [];

 

async function renderPlayers() {

    try {

        const players = await apiGet('/players');

        allPlayers = players;

        const grid = document.getElementById('playersGrid');

       

        if (players.length === 0) {

            grid.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">⚽</div>

                    <h3>No Players Yet</h3>

                    <p>Add your first player to get started!</p>

                </div>

            `;

            return;

        }

       

        grid.innerHTML = players.map(player => {

            const overall = getOverallRating(player.stats);

            const rarity = player.rarity || getRarityFromRating(overall);

           

            return `

                <div class="fifa-card ${rarity}" onclick="showVoteModal('${player.id}')">

                    <div class="card-header">

                        <div class="card-rating">

                            <div class="overall-rating">${overall}</div>

                            <div class="position-badge">${player.primaryPosition}</div>

                        </div>

                    </div>

                   

                    <div class="card-image-container">

                        ${player.imageUrl

                            ? `<img src="${player.imageUrl}" class="card-image" alt="${player.name}" onerror="this.parentElement.innerHTML='<div class=\\'card-image-placeholder\\'>⚽</div>'">`

                            : `<div class="card-image-placeholder">⚽</div>`

                        }

                    </div>

                   

                    <div class="player-name">${player.name}</div>

                   

                    ${player.stats ? `

                        <div class="card-stats">

                            <div class="stat-item">

                                <span class="stat-label">PAC</span>

                                <span class="stat-value">${player.stats.pace}</span>

                            </div>

                            <div class="stat-item">

                                <span class="stat-label">SHO</span>

                                <span class="stat-value">${player.stats.shooting}</span>

                            </div>

                            <div class="stat-item">

                                <span class="stat-label">PAS</span>

                                <span class="stat-value">${player.stats.passing}</span>

                            </div>

                            <div class="stat-item">

                                <span class="stat-label">DRI</span>

                                <span class="stat-value">${player.stats.dribbling}</span>

                            </div>

                            <div class="stat-item">

                                <span class="stat-label">DEF</span>

                                <span class="stat-value">${player.stats.defending}</span>

                            </div>

                            <div class="stat-item">

                                <span class="stat-label">PHY</span>

                                <span class="stat-value">${player.stats.physical}</span>

                            </div>

                        </div>

                        ${player.stats.voteCount > 0 ? `

                            <div class="vote-count">⭐ ${player.stats.voteCount} ${player.stats.voteCount === 1 ? 'vote' : 'votes'}</div>

                        ` : ''}

                    ` : ''}

                </div>

            `;

        }).join('');

    } catch (error) {

        console.error('Error rendering players:', error);

        document.getElementById('playersGrid').innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">❌</div>

                <h3>Connection Error</h3>

                <p>Cannot connect to server. Please check if the backend is running.</p>

                <p style="font-size: 0.9rem; color: var(--text-gray); margin-top: 10px;">

                    Expected API: ${API_URL}

                </p>

            </div>

        `;

    }

}

 

function showAddPlayerModal() {

    showModal('addPlayerModal');

}

 

async function addPlayer(e) {

    e.preventDefault();

   

    try {

        const playerId = 'player_' + Date.now();

        const rarity = document.getElementById('cardRarity').value;

       

        await apiPost('/players', {

            id: playerId,

            name: document.getElementById('playerName').value,

            imageUrl: document.getElementById('playerImage').value,

            primaryPosition: document.getElementById('primaryPosition').value,

            rarity: rarity

        });

       

        closeModal('addPlayerModal');

        document.getElementById('playerName').value = '';

        document.getElementById('playerImage').value = '';

        await renderPlayers();

    } catch (error) {

        console.error('Error adding player:', error);

        alert('Failed to add player: ' + error.message);

    }

}

 

async function showVoteModal(playerId) {

    currentVotePlayerId = playerId;

   

    try {

        const player = allPlayers.find(p => p.id === playerId);

        if (!player) return;

       

        document.getElementById('votePlayerName').textContent = `Rating ${player.name}`;

       

        ['Pace', 'Shooting', 'Passing', 'Dribbling', 'Defending', 'Physical'].forEach(stat => {

            const input = document.getElementById('vote' + stat);

            input.value = 50;

            updateSlider('vote' + stat);

        });

       

        showModal('voteModal');

    } catch (error) {

        console.error('Error showing vote modal:', error);

    }

}

 

function updateSlider(inputId) {

    const input = document.getElementById(inputId);

    const value = input.value;

    const valueSpan = document.getElementById(inputId + 'Value');

    const bar = document.getElementById(inputId + 'Bar');

   

    valueSpan.textContent = value;

    bar.style.width = value + '%';

}

 

async function submitVote(e) {

    e.preventDefault();

   

    try {

        const voteId = 'vote_' + Date.now();

       

        await apiPost('/stats/vote', {

            id: voteId,

            voterId: currentUserId,

            playerId: currentVotePlayerId,

            pace: parseInt(document.getElementById('votePace').value),

            shooting: parseInt(document.getElementById('voteShooting').value),

            passing: parseInt(document.getElementById('votePassing').value),

            dribbling: parseInt(document.getElementById('voteDribbling').value),

            defending: parseInt(document.getElementById('voteDefending').value),

            physical: parseInt(document.getElementById('votePhysical').value)

        });

       

        closeModal('voteModal');

        await renderPlayers();

    } catch (error) {

        console.error('Error submitting vote:', error);

        alert('Failed to submit vote: ' + error.message);

    }

}

 

// TEAM PICKER

let selectedPlayersForGame = [];

 

async function renderTeamPicker() {

    try {

        if (allPlayers.length === 0) {

            allPlayers = await apiGet('/players');

        }

       

        const container = document.getElementById('playerSelection');

       

        if (allPlayers.length === 0) {

            container.innerHTML = '<p style="color: var(--text-gray);">No players available. Add players first!</p>';

            return;

        }

       

        container.innerHTML = allPlayers.map(player => `

            <div class="checkbox-item">

                <input type="checkbox" id="select_${player.id}" value="${player.id}"

                    ${selectedPlayersForGame.includes(player.id) ? 'checked' : ''}

                    onchange="togglePlayerSelection('${player.id}')">

                <label for="select_${player.id}">${player.name} (${player.primaryPosition})</label>

            </div>

        `).join('');

    } catch (error) {

        console.error('Error rendering team picker:', error);

    }

}

 

function togglePlayerSelection(playerId) {

    if (selectedPlayersForGame.includes(playerId)) {

        selectedPlayersForGame = selectedPlayersForGame.filter(id => id !== playerId);

    } else {

        selectedPlayersForGame.push(playerId);

    }

}

 

function randomTeams() {

    if (selectedPlayersForGame.length < 2) {

        alert('Please select at least 2 players!');

        return;

    }

   

    const selectedPlayers = allPlayers.filter(p => selectedPlayersForGame.includes(p.id));

    const shuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);

    const mid = Math.ceil(shuffled.length / 2);

    const team1 = shuffled.slice(0, mid);

    const team2 = shuffled.slice(mid);

   

    displayTeams(team1, team2);

}

 

function captainMode() {

    if (selectedPlayersForGame.length < 4) {

        alert('Please select at least 4 players for captain mode!');

        return;

    }

   

    const selectedPlayers = allPlayers.filter(p => selectedPlayersForGame.includes(p.id));

    const sorted = selectedPlayers.sort((a, b) => getOverallRating(b.stats) - getOverallRating(a.stats));

   

    const captain1 = sorted[0];

    const captain2 = sorted[1];

    const remaining = sorted.slice(2);

   

    const team1 = [captain1];

    const team2 = [captain2];

   

    remaining.forEach((player, index) => {

        if (index % 2 === 0) {

            team1.push(player);

        } else {

            team2.push(player);

        }

    });

   

    displayTeams(team1, team2, captain1.name, captain2.name);

}

 

function displayTeams(team1, team2, captain1Name = null, captain2Name = null) {

    const container = document.getElementById('teamsResult');

   

    const team1Avg = Math.round(team1.reduce((sum, p) => sum + getOverallRating(p.stats), 0) / team1.length);

    const team2Avg = Math.round(team2.reduce((sum, p) => sum + getOverallRating(p.stats), 0) / team2.length);

   

    container.innerHTML = `

        <div class="team-display team-1">

            <div class="team-header">

                <div>

                    <div class="team-name">Team 1 ${captain1Name ? `(Captain: ${captain1Name})` : ''}</div>

                    <div class="team-avg">Average Rating: ${team1Avg}</div>

                </div>

            </div>

            ${team1.map(p => `

                <div class="player-list-item">

                    <div class="player-info">

                        <span style="font-weight: 600; font-size: 1.1rem;">${p.name}</span>

                        <span class="position-badge" style="background: ${getPositionColor(p.primaryPosition)};">${p.primaryPosition}</span>

                    </div>

                    <span style="font-size: 1.3rem; font-weight: 700; color: var(--primary);">${getOverallRating(p.stats)}</span>

                </div>

            `).join('')}

        </div>

       

        <div class="team-display team-2">

            <div class="team-header">

                <div>

                    <div class="team-name">Team 2 ${captain2Name ? `(Captain: ${captain2Name})` : ''}</div>

                    <div class="team-avg">Average Rating: ${team2Avg}</div>

                </div>

            </div>

            ${team2.map(p => `

                <div class="player-list-item">

                    <div class="player-info">

                        <span style="font-weight: 600; font-size: 1.1rem;">${p.name}</span>

                        <span class="position-badge" style="background: ${getPositionColor(p.primaryPosition)};">${p.primaryPosition}</span>

                    </div>

                    <span style="font-size: 1.3rem; font-weight: 700; color: #ff006e;">${getOverallRating(p.stats)}</span>

                </div>

            `).join('')}

        </div>

    `;

}

 

// POLLS

async function renderPolls() {

    try {

        const polls = await apiGet('/polls');

        const container = document.getElementById('pollsList');

       

        if (polls.length === 0) {

            container.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">📊</div>

                    <h3>No Polls Yet</h3>

                    <p>Create your first poll!</p>

                </div>

            `;

            return;

        }

       

        container.innerHTML = polls.map(poll => {

            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

           

            return `

                <div class="poll-card">

                    <div class="poll-title">${poll.title}</div>

                    ${poll.description ? `<div class="poll-description">${poll.description}</div>` : ''}

                    <div style="color: var(--text-gray); margin-bottom: 20px; font-size: 0.9rem;">

                        Total votes: ${totalVotes}

                    </div>

                    ${poll.options.map(option => {

                        const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

                        const isVoted = option.voters && option.voters.includes(currentUserId);

                       

                        return `

                            <div class="poll-option ${isVoted ? 'voted' : ''}" onclick="voteOnPoll('${poll.id}', '${option.id}')">

                                <div class="poll-bar" style="width: ${percentage}%;"></div>

                                <div class="poll-option-content">

                                    <div>

                                        <div class="poll-option-text">${option.text}</div>

                                        <div class="poll-option-votes">${option.votes} votes (${percentage}%)</div>

                                    </div>

                                    ${isVoted ? '<span style="color: var(--primary); font-size: 1.5rem;">✓</span>' : ''}

                                </div>

                            </div>

                        `;

                    }).join('')}

                    <button class="btn-outline" style="margin-top: 16px; width: 100%;" onclick="deletePoll('${poll.id}')">

                        Delete Poll

                    </button>

                </div>

            `;

        }).join('');

    } catch (error) {

        console.error('Error rendering polls:', error);

        document.getElementById('pollsList').innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">❌</div>

                <h3>Connection Error</h3>

                <p>Cannot connect to server.</p>

            </div>

        `;

    }

}

 

function showCreatePollModal() {

    showModal('createPollModal');

}

 

async function createPoll(e) {

    e.preventDefault();

   

    try {

        const pollId = 'poll_' + Date.now();

        const optionsText = document.getElementById('pollOptions').value;

        const options = optionsText.split('\n').filter(line => line.trim()).map(text => ({

            id: 'option_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),

            text: text.trim()

        }));

       

        if (options.length < 2) {

            alert('Please provide at least 2 options!');

            return;

        }

       

        await apiPost('/polls', {

            id: pollId,

            title: document.getElementById('pollTitle').value,

            description: document.getElementById('pollDescription').value,

            pollType: 'general',

            options: options

        });

       

        closeModal('createPollModal');

        document.getElementById('pollTitle').value = '';

        document.getElementById('pollDescription').value = '';

        document.getElementById('pollOptions').value = '';

        await renderPolls();

    } catch (error) {

        console.error('Error creating poll:', error);

        alert('Failed to create poll: ' + error.message);

    }

}

 

async function voteOnPoll(pollId, optionId) {

    try {

        const voteId = 'vote_' + Date.now();

       

        await apiPost(`/polls/${pollId}/vote`, {

            voteId: voteId,

            optionId: optionId,

            voterId: currentUserId

        });

       

        await renderPolls();

    } catch (error) {

        console.error('Error voting on poll:', error);

        alert('Failed to vote: ' + error.message);

    }

}

 

async function deletePoll(pollId) {

    if (!confirm('Are you sure you want to delete this poll?')) return;

   

    try {

        await apiDelete(`/polls/${pollId}`);

        await renderPolls();

    } catch (error) {

        console.error('Error deleting poll:', error);

        alert('Failed to delete poll: ' + error.message);

    }

}

 

// Initialize

console.log('🚀 Soccer Pickup FIFA initialized');

console.log('📡 API URL:', API_URL);

renderPlayers();