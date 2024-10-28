import React, { useEffect, useState } from "react";
import { Header } from "../components/Header";
import axios from "axios";
import { useCookies } from "react-cookie";
import { url } from "../const";
import { useHistory, useParams } from "react-router-dom";
import "./editTask.scss";

export const EditTask = () => {
  const history = useHistory();
  const { listId, taskId } = useParams();
  const [cookies] = useCookies();
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [limit, setLimit] = useState(""); // 期限日時を保持
  const [errorMessage, setErrorMessage] = useState("");

  const handleTitleChange = (e) => setTitle(e.target.value);
  const handleDetailChange = (e) => setDetail(e.target.value);
  const handleIsDoneChange = (e) => setIsDone(e.target.value === "done");
  const handleLimitChange = (e) => setLimit(e.target.value); // 期限日時の変更

  const onUpdateTask = () => {
    const formattedLimit = isDone
      ? new Date() // 完了時は現在の時間を設定
      : new Date(limit); // 未完了時はユーザーが選択した時間を設定

    const data = {
      title: title,
      detail: detail,
      done: isDone,
      limit: formattedLimit, // フォーマット済みの期限日時
    };

    axios
      .put(`${url}/lists/${listId}/tasks/${taskId}`, data, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then(() => {
        history.push("/");
      })
      .catch((err) => {
        setErrorMessage(`更新に失敗しました。${err}`);
      });
  };

  const onDeleteTask = () => {
    axios
      .delete(`${url}/lists/${listId}/tasks/${taskId}`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then(() => {
        history.push("/");
      })
      .catch((err) => {
        setErrorMessage(`削除に失敗しました。${err}`);
      });
  };

  // 日本のローカルタイムでのフォーマットを作成
  const toJST = (date) => {
    // UTCからJSTに変換
    const jstDate = new Date(date); // UTCの時間を，日本時間で得ている(new Date()は，実行環境での時間を返してくれる．空白なら今の時間，今回みたいにUTCの時間を入れたら，その時間から9時間進んだ時間を返してくれる！)
    // console.log("jstDate: ", jstDate);

    const year = jstDate.getFullYear();
    const month = String(jstDate.getMonth() + 1).padStart(2, "0"); // 月は0始まりなので+1
    const day = String(jstDate.getDate()).padStart(2, "0");
    const hours = String(jstDate.getHours()).padStart(2, "0");
    const minutes = String(jstDate.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`; // YYYY-MM-DDTHH:MM形式で返す
  };

  useEffect(() => {
    axios
      .get(`${url}/lists/${listId}/tasks/${taskId}`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        const task = res.data;
        setTitle(task.title);
        setDetail(task.detail);
        setIsDone(task.done);
        // タスクの期限を日本のローカルタイムで表示
        // console.log("task.limit: ", task.limit);
        setLimit(toJST(task.limit)); // task.limitは，UTCの時間のため，日本時間より9時間早い．それを修正している．
      })
      .catch((err) => {
        setErrorMessage(`タスク情報の取得に失敗しました。${err}`);
      });
  }, []);

  // 残り時間の計算
  const calculateRemainingTime = () => {
    const limitDate = new Date(limit);
    const now = new Date(); // 現在の日時を取得
    // console.log("now : ", now);
    const RT = (limitDate - now) / 1000; // diffは，単位がミリ秒なので，1000で割って，単位を秒に．RT(Remaining Time)．
    // console.log("RT : ", RT);

    if (RT <= 0) {
      return "期限切れ";
    }

    // Math.floorで，小数点以下を切り捨てて，整数値を返している
    const day = Math.floor(RT / 86400);
    const allhours = Math.floor(RT / 3600); // 3600(60X60)で割ることでhour(day分を含めた)を求めている
    const hours = allhours - (day*24)
    const minutes = Math.floor((RT % 3600) / 60); // 3600で余りを出して，それを60で割ることで，minuteを求めている

    return `${day}日${hours}時間${minutes}分`;
  };

  return (
    <div>
      <Header />
      <main className="edit-task">
        <h2>タスク編集</h2>
        <p className="error-message">{errorMessage}</p>
        <form className="edit-task-form">
          <label>タイトル</label>
          <input
            type="text"
            onChange={handleTitleChange}
            className="edit-task-title"
            value={title}
          />
          <br />
          <label>詳細</label>
          <textarea
            type="text"
            onChange={handleDetailChange}
            className="edit-task-detail"
            value={detail}
          />
          <br />

          {/* 期限を設定するラベル */}
          <label>
            期限日時
            <br />
            (完了を選び，更新を押せば，現在時刻で終わったと記録されます)
          </label>
          <br />
          <input
            type="datetime-local"
            onChange={handleLimitChange}
            value={limit}
          />
          <br />

          <div>
            <input
              type="radio"
              id="todo"
              name="status"
              value="todo"
              onChange={handleIsDoneChange}
              checked={isDone === false}
            />
            未完了
            <input
              type="radio"
              id="done"
              name="status"
              value="done"
              onChange={handleIsDoneChange}
              checked={isDone === true}
            />
            完了
          </div>

          {/* 残り時間の表示 */}
          <p>残り時間: {calculateRemainingTime()}</p>

          <button
            type="button"
            className="delete-task-button"
            onClick={onDeleteTask}
          >
            削除
          </button>
          <button
            type="button"
            className="edit-task-button"
            onClick={onUpdateTask}
          >
            更新
          </button>
        </form>
      </main>
    </div>
  );
};
