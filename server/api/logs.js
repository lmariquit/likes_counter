const router = require('express').Router()
const { Log } = require('../db/models')

module.exports = router

// api/logs
router.post('/', async (req, res, next) => {
    const { phrase, likeCount } = req.body
    try {
        const newLog = await Log.create({
            userId: req.user.id,
            phrase,
            likeCount
        })
        res.json(newLog)
    } catch(err) {
        console.error(err)
    }
})

router.delete('/', async (req, res, next) => {
    const { phrase } = req.body
    try {
        await Log.destroy({
            where: {
                userId: req.user.id,
                phrase
            }
        })
        res.json(toBeDeleted.likeCount)
    } catch(err) {
        console.error(err)
    }
})