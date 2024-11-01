const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const bcrypt = require('bcrypt')

const dbPath = path.join(__dirname, 'userData.db')

let db = null

const startedSqlConnection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server started running at http://localhost:3000/....')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(-1)
  }
}

startedSqlConnection()

app.post('/register', async (request, response) => {
  const bodyDetails = request.body
  const {username, name, password, gender, location} = bodyDetails
  const usernameSqlStatement = `SELECT * FROM user WHERE username = "${username}";`

  const dbObjectQuery = await db.get(usernameSqlStatement)

  if (dbObjectQuery === undefined) {
    const hashPasswordMethod = await bcrypt.hash(password, 10)
    const addSqlStatement = `INSERT INTO user (username, name, password, gender, location)
    VALUES ("${username}", "${name}", "${hashPasswordMethod}", "${gender}", "${location}");`

    const validePassword = password => password.length > 5

    if (validePassword(password)) {
      await db.run(addSqlStatement)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const sqlStatement = `SELECT * FROM user WHERE username = "${username}";`
  const getQuery = await db.get(sqlStatement)
  if (getQuery === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const compareMethod = await bcrypt.compare(password, getQuery.password)
    if (compareMethod === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password/', async (request, response) => {
  const requestDetails = request.body
  const {username, oldPassword, newPassword} = requestDetails
  const sqlStatement = `SELECT * FROM user WHERE username = "${username}";`

  const getQuery = await db.get(sqlStatement)

  if (getQuery === undefined) {
    response.status(400)
    response.send('Invalid username')
  } else {
    const compareMethod = await bcrypt.compare(oldPassword, getQuery.password)
    if (compareMethod === true) {
      const validPassword = newPassword => newPassword.length > 4
      if (validPassword(newPassword)) {
        const hashPassword = await bcrypt.hash(newPassword, 10)
        const updateSqlStatement = `UPDATE user SET password = "${hashPassword}" WHERE username = "${username}";`
        const getSqlQuery = await db.run(updateSqlStatement)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
