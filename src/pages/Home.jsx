/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { Header } from "../components/Header";
import { url } from "../const";
import "./home.scss";

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState("todo"); // todo->未完了 done->完了
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [cookies] = useCookies();
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);

  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data);
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id;
    if (typeof listId !== "undefined") {
      setSelectListId(listId);
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      });
  };

  const handleKeyDown = (event, id) => {
    if (event.key === "Enter") {
      handleSelectList(id);
    }
  };

  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>
                  選択中のリストを編集
                </Link>
              </p>
            </div>
          </div>
          <ul className="list-tab">
            {lists.map((list, key) => {
              const isActive = list.id === selectListId;
              return (
                <li // リストに対し，タブで選択できるよう以下のコードを追加
                  key={key}
                  role="tab" // 要素をタブのように扱えるように
                  tabIndex={0} // フォーカス可能にする
                  aria-selected={isActive} // 選択状態を示す    
                  className={`list-tab-item ${isActive ? "active" : ""}`}
                  onClick={() => handleSelectList(list.id)}
                  onKeyDown={(event) => handleKeyDown(event, list.id)} // Enterキーが押されたときの処理
                >
                  {list.title}
                </li>
              );
            })}
          </ul>
          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select
                onChange={handleIsDoneDisplayChange}
                className="display-select"
              >
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks
              tasks={tasks}
              selectListId={selectListId}
              isDoneDisplay={isDoneDisplay}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props;
  if (tasks === null) return <></>;

  // 日本のローカルタイムで表示
  const toJST = (dateString) => {
    const jstDate = new Date(dateString); // 日本時間に合わせる

    // ローカルタイムゾーンでのフォーマットを作成
    const year = jstDate.getFullYear();
    const month = String(jstDate.getMonth() + 1).padStart(2, "0"); // 月は0始まりなので+1
    const day = String(jstDate.getDate()).padStart(2, "0"); //padStartで，01のように表示させている，これの方が見やすい！
    const hours = String(jstDate.getHours()).padStart(2, "0");
    const minutes = String(jstDate.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`; // YYYY-MM-DD HH:mmの形式に
  };

  // 残り時間の計算
  const calculateRemainingTime = (limit) => {
    const limitDate = new Date(limit);
    const now = new Date(); // 現在の日時を取得
    const RT = (limitDate - now) / 1000; // diffは，単位がミリ秒なので，1000で割って，単位を秒に．RT(Remaining Time)．

    if (RT <= 0) {
      return "期限切れ";
    }

    // Math.floorで．整数値を返している
    const day = Math.floor(RT / 86400);
    const allhours = Math.floor(RT / 3600); // 3600(60X60)で割ることでhour(day分を含めた)を求めている
    const hours = allhours - day * 24;
    const minutes = Math.floor((RT % 3600) / 60); // 3600で余りを出して，それを60で割ることで，minuteを求めている

    return `${day}日${hours}時間${minutes}分`;
  };

  if (isDoneDisplay === "done") {
    return (
      <ul>
        {tasks
          .filter((task) => {
            return task.done === true;
          })
          .map((task, key) => (
            <li key={key} className="task-item">
              <Link
                to={`/lists/${selectListId}/tasks/${task.id}`}
                className="task-item-link"
              >
                {task.title}
                {"："}
                {/* こっちは完了が選ばれる(task.doneは133行目より，trueのため) */}
                {task.done ? "完了" : "未完了"}
                {/* タスクが終わった日を表示 */}
                <br />
                {"完了日時："}
                {toJST(task.limit)}{" "}
              </Link>
            </li>
          ))}
      </ul>
    );
  }

  return (
    <ul>
      {tasks
        .filter((task) => {
          return task.done === false;
        })
        .map((task, key) => (
          <li key={key} className="task-item">
            <Link
              to={`/lists/${selectListId}/tasks/${task.id}`}
              className="task-item-link"
            >
              {task.title}
              {"："}
              {/* こっちは未完了が選ばれる(task.doneは151行目より，falseのため) */}
              {task.done ? "完了" : "未完了"}
              {/* 期限を表示 */}
              <br />
              {"期限："}
              {toJST(task.limit)}
              {/* 残り時間の表示 */}
              <br />
              {"残り時間："}
              {calculateRemainingTime(task.limit)}{" "}
            </Link>
          </li>
        ))}
    </ul>
  );
};
