const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbpath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null

const intializeDb = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (e) {
    console.log(`DB Error:${e.message}`)
  }
}

intializeDb()

const convertPlayer = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const convertMatch = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
    SELECT
      *
    FROM
      player_details;`
  const playersArray = await db.all(getPlayersQuery)
  response.send(playersArray.map(eachPlayer => convertPlayer(eachPlayer)))
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerByIdQuery = `
    SELECT
      *
    FROM
      player_details
    WHERE
      player_id=${playerId};`

  const player = await db.get(getPlayerByIdQuery)
  response.send(convertPlayer(player))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body

  const updateQuery = `
    UPDATE
      player_details
    SET
      player_name='${playerName}'  
    WHERE
      player_id=${playerId};`

  await db.run(updateQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchByIdQuery = `
    SELECT
      *
    FROM
      match_details
    WHERE
      match_id=${matchId};`

  const match = await db.get(getMatchByIdQuery)
  response.send(convertMatch(match))
})

app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params
  const getMatchesQuery = `
    SELECT
      *
    FROM player_match_score
      NATURAL JOIN match_details
    WHERE
      player_id=${playerId};`
  const matchesArray = await db.all(getMatchesQuery)
  response.send(matchesArray.map(eachMatch => convertMatch(eachMatch)))
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayersListQuery = `
    SELECT
      player_details.player_id AS playerId,
      player_details.player_name AS playerName
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id=${matchId};`
  const playersList = await db.all(getPlayersListQuery)
  console.log(playersList)
  response.send({
    playerId: playersList['playerId'],
    playerName: playersList['playerName'],
  })
})

app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const getStatsQuery = `
    SELECT
      player_details.player_id AS playerId,
      player_details.player_name AS playerName,
      SUM(player_match_score.score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_details
      INNER JOIN player_match_score ON 
        player_details.player_id= player_match_score.player_id
    WHERE
      player_details.player_id=${playerId};`
  const stats = await db.get(getStatsQuery)
  console.log(stats)
  response.send({
    playerId: stats['playerId'],
    playerName: stats['playerName'],
    totalScore: stats['totalScore'],
    totalFours: stats['totalFours'],
    totalSixes: stats['totalSixes'],
  })
})
module.exports = app
