const router = require('express').Router();
const mongoose = require('mongoose');
const auth = require('../auth');

const User = mongoose.model('User');
const Article = mongoose.model('Article');

// Return a list of tags
router.get('/', (req, res, next) => {
  // #swagger.tags = ["tags"]
  // #swagger.summary = 'Получить общий усписок тегов (устаревший метод)'

  Article.find()
    .distinct('tagList')
    .then((tags) => res.json({ tags }))
    .catch(next);
});

router.get('/follow', auth.required, (req, res, next) => {
  // #swagger.tags = ["tags"]
  // #swagger.summary = 'Получить список тегов из подписок пользователя'
  User.findById(req.payload.id)
    .then((user) => {
      if (!user) {
        return res.sendStatus(401);
      }
      return res.json({ tags: user.followingTags });
    });
});

router.post('/:tag/follow', auth.required, (req, res, next) => {
  // #swagger.tags = ["tags"]
  // #swagger.summary = 'Подписаться на тег'
  const { tag } = req.params;

  User.findById(req.payload.id)
    .then((user) => {
      if (!user) {
        return res.sendStatus(401);
      }

      return user
        .followTag(tag)
        .then(() => res.status(204).send());
    })
    .catch(next);
});

router.delete('/:tag/follow', auth.required, (req, res, next) => {
  // #swagger.tags = ["tags"]
  // #swagger.summary = 'Отписаться от тега'
  const { tag } = req.params;

  User.findById(req.payload.id)
    .then((user) => {
      if (!user) {
        return res.sendStatus(401);
      }
      return user
        .unfollowTag(tag)
        .then(() => res.status(204).send());
    })
    .catch(next);
});

router.get('/top', async (req, res, next) => {
  // #swagger.tags = ["tags"]
  // #swagger.summary = 'Получить список самых популярных тегов'
  try {
    const tags = await Article.aggregate([
      { $match: { state: 'published' } },
      { $project: { tagList: 1 } },
      { $unwind: '$tagList' },
      { $group: { _id: '$tagList', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { _id: 0, name: '$_id', count: 1 } }]).exec();
    return res.json({ tags });
  } catch (err) { return next(err); }
});
module.exports = router;
