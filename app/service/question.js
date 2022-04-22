"use strict";

const Service = require("egg").Service;
const dayjs = require("dayjs");

class QuestionService extends Service {
  async getQuestions(userId, type) {
    const { app } = this;
    try {
      return await app.mysql.query(
        ` select q.*,c.collect,e.user_id from question q LEFT JOIN 
        (select question_id,COUNT(question_id) AS collect from collect where is_collect = 1 GROUP BY
         question_id) c on q.id = c.question_id LEFT JOIN collect e on e.question_id = q.id and e.is_collect = 1 and e.user_id = ? WHERE q.type = ?`,
        [userId, type],
      );
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getQuestionDetail(userId, questionId) {
    const { app } = this;
    try {
      return await app.mysql.query(
        "select * from question q left join collect c on q.id = c.question_id and c.user_id = ?  where q.id = ?",
        [userId, questionId],
      );
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async collectQuestion(userId, questionId) {
    try {
      const res = await this.app.mysql.query(
        "select * from collect where user_id = ? and question_id = ? ",
        [userId, questionId],
      );
      if (Object.keys(res).length) {
        return await this.app.mysql.query(
          "update collect set is_collect = ? where user_id = ? and question_id = ? ",
          [res[0].is_collect ? 0 : 1, userId, questionId],
        );
      } else {
        return await this.app.mysql.query(
          "insert into collect  (user_id,question_id,save,is_collect) values (?,?,?,?) ",
          [userId, questionId, "", 1],
        );
      }
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async saveCode(userId, questionId, value, isCollect) {
    try {
      const selectRes = await this.app.mysql.query(
        "select id from collect where user_id = ? and question_id = ?",
        [userId, questionId],
      );
      let sql = "";
      if (Object.keys(selectRes).length) {
        sql = `update collect set save = "${value}" where id = ${selectRes[0].id}`;
      } else {
        sql = `insert into collect (user_id, question_id, save, is_collect) values ('${userId}','${questionId}','${value}',${isCollect})`;
      }
      const res = await this.app.mysql.query(sql);
      if (res.affectedRows === 1) {
        return {
          code: 1,
          msg: "保存成功！",
        };
      } else {
        return {
          code: 0,
          msg: "保存失败！",
        };
      }
    } catch (error) {
      console.log(error);
      return {
        code: 0,
        msg: error.sqlMessage,
      };
    }
  }

  async submitCode({ userId, questionId, value }) {
    try {
      const time = dayjs().format("YYYY-MM-DD HH:mm:ss");
      return await this.app.mysql.query(
        "insert into submit (user_id, question_id,data, time) values (?,?,?,?)",
        [userId, questionId, value, time],
      );
    } catch (error) {
      console.log(error);
      return {
        code: 0,
        msg: error.sqlMessage,
      };
    }
  }

  async getSubmit({ userId, questionId }) {
    try {
      const res = await this.app.mysql.query(
        "select * from submit s left join user u on u.id = s.user_id where user_id = ? and question_id = ? order by s.time desc",
        [userId, questionId],
      );
      return (this.ctx.body = {
        code: 1,
        data: res,
      });
    } catch (error) {
      return (this.ctx.body = {
        code: 0,
        data: error.sqlMessage,
      });
    }
  }

  async setMark({ markId, mark }) {
    try {
      const res = await this.app.mysql.query("update submit set mark = ? where mark_id = ?  ", [
        mark,
        markId,
      ]);
      if (res.affectedRows) {
        return (this.ctx.body = {
          code: 1,
          msg: "保存成功！",
        });
      }
      return (this.ctx.body = {
        code: 0,
        msg: "保存失败！",
      });
    } catch (error) {
      console.log(error);
      return (this.ctx.body = {
        code: 0,
        msg: error.sqlMessage,
      });
    }
  }

  async deleteSubmit({ markId, userId }) {
    try {
      const res = await this.app.mysql.query(
        "delete from submit where mark_id = ? and user_id = ?",
        [markId, userId],
      );
      if (res.affectedRows) {
        return (this.ctx.body = {
          code: 1,
          msg: "删除成功！",
        });
      }
      return (this.ctx.body = {
        code: 0,
        msg: "删除失败！",
      });
    } catch (error) {
      console.log(error);
      return (this.ctx.body = {
        code: 0,
        msg: error.sqlMessage,
      });
    }
  }

  async submitComment({ userId, questionId, content }) {
    try {
      const res = await this.app.mysql.query(
        "insert into comment (user_id, question_id, content,comment_time) values (?,?,?,?)",
        [userId, questionId, content, dayjs().format("YYYY-MM-DD HH:mm:ss")],
      );
      console.log(res);
      if (res.affectedRows) {
        return (this.ctx.body = {
          code: 1,
          msg: "评论成功！",
        });
      }
      return (this.ctx.body = {
        code: 0,
        msg: "评论失败！",
      });
    } catch (error) {
      console.log(error);
      return (this.ctx.body = {
        code: 0,
        msg: error.sqlMessage,
      });
    }
  }

  async getComment({ userId, questionId }) {
    console.log(userId, questionId);
    try {
      const res = await this.app.mysql.query(
        "select c.*,u.name,u.avatar from comment c join user u on c.user_id =  u.id  where user_id = ? and question_id = ?",
        [userId, questionId],
      );
      return (this.ctx.body = {
        code: 1,
        msg: "ok",
        data: res,
      });
    } catch (error) {
      console.log(error);
      return (this.ctx.body = {
        code: 0,
        data: [],
        msg: error.sqlMessage,
      });
    }
  }
}

module.exports = QuestionService;
