import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [editingTask, setEditingTask] = useState(null);

    // GETリクエストを送信してタスクを取得
    useEffect(() => {
        axios
            .get('http://127.0.0.1:5000/tasks')
            .then((response) => {
                console.log('GET response:', response);
                setTasks(response.data);
            })
            .catch((error) => {
                console.error('Error fetching tasks:', error);
            });
    }, []);

    // POSTリクエストを送信して新しいタスクを追加
    const handleSubmit = (event) => {
        event.preventDefault();
        if (editingTask) {
            // 更新するタスクがある場合はPUTリクエストを送信
            axios
                .put('http://127.0.0.1:5000/tasks', {
                    id: editingTask.id,
                    title,
                    description,
                })
                .then((response) => {
                    console.log('PUT response:', response);
                    const updatedTasks = tasks.map((task) =>
                        task.id === editingTask.id ? response.data : task
                    );
                    setTasks(updatedTasks);
                    setEditingTask(null);
                })
                .catch((error) => {
                    console.error('Error updating task:', error);
                });
        } else {
            // 新しいタスクを追加する場合はPOSTリクエストを送信
            axios
                .post('http://127.0.0.1:5000/tasks', { title, description })
                .then((response) => {
                    console.log('POST response:', response);
                    setTasks([...tasks, response.data]);
                })
                .catch((error) => {
                    console.error('Error adding task:', error);
                });
        }
        setTitle('');
        setDescription('');
    };

    // タスクの編集モードに切り替える
    const handleEdit = (task) => {
        setTitle(task.title);
        setDescription(task.description);
        setEditingTask(task);
    };

    // 編集モードを解除する
    const handleCancelEdit = () => {
        setTitle('');
        setDescription('');
        setEditingTask(null);
    };

    // DELETEリクエストを送信してタスクを削除
    const handleDelete = (taskId) => {
        axios
            .delete('http://127.0.0.1:5000/tasks', { data: { id: taskId } })
            .then((response) => {
                console.log('DELETE response:', response);
                setTasks(tasks.filter((task) => task.id !== taskId));
            })
            .catch((error) => {
                console.error('Error deleting task:', error);
            });
    };

    return (
        <div>
            <h1>Task Manager</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
                <button type="submit">
                    {editingTask ? 'Update Task' : 'Add Task'}
                </button>
                {editingTask && <button type="button" onClick={handleCancelEdit}>Cancel</button>}
            </form>
            <ul>
                {tasks.map((task) => (
                    <li key={task.id}>
                        <h2>{task.title}</h2>
                        <p>{task.description}</p>
                        <button onClick={() => handleEdit(task)}>Edit</button>
                        <button onClick={() => handleDelete(task.id)}>
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;
