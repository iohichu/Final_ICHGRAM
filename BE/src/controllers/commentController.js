import Comment from '../models/commentModel.js';
import Notification from '../models/notificationModel.js';
import Post from '../models/postModel.js';
import User from '../models/userModel.js';

// Получение комментариев к посту
export const getPostComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post_id: req.params.postId });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении комментариев' });
  }
};

// Создание комментария
export const createComment = async (req, res) => {
  const { postId } = req.params; // ID поста из маршрута
  const { comment_text } = req.body; // Текст комментария из тела запроса
  const userId = req.user._id; // ID текущего пользователя из authMiddleware
  const profileImage  = req.user.profile_image ;
  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Пост не найден' });

    const comment = new Comment({
      post_id: postId,
      user_id: userId,
      profile_image : profileImage ,
      comment_text,
      created_at: new Date(),
    });

    await comment.save();

    post.comments_count += 1;
    await post.save();

  
    const sender = await User.findById(userId);

    const newNotification = new Notification({
      user_id: post.user_id,
      type: "Comment",
      // content: `${sender.username} commented your post.`,
      content: `commented your post.`,
      sender_id: userId
    })
    await newNotification.save();


    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при создании комментария' });
  }
};

// Удаление комментария
export const deleteComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: 'Комментарий не найден' });

    await Comment.findByIdAndDelete(commentId);

    const post = await Post.findById(comment.post_id);
    post.comments_count -= 1;
    await post.save();

    res.status(200).json({ message: 'Комментарий удалён' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении комментария' });
  }
};


// Лайк или анлайк комментария
export const likeComment = async (req, res) => {
  const { commentId } = req.params; // ID комментария из маршрута
  const userId = req.user._id; // ID текущего пользователя из authMiddleware

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: 'Комментарий не найден' });

    // Проверяем, есть ли лайк от пользователя
    const isLiked = comment.likes?.includes(userId);

    if (isLiked) {
      // Если уже лайкнут, убираем лайк
      comment.likes = comment.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      // Если не лайкнут, добавляем лайк
      comment.likes.push(userId);
    }

    await comment.save();

    return res.status(200).json({
      _id: comment._id,
      likes_count: comment.likes.length,
      isLiked: !isLiked, // Отправляем текущее состояние лайка
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при лайке комментария' });
  }
};
