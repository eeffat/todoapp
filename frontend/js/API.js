//------------------ ↓ GLOBAL VARIABLES (ALLOWED TO BE USED IN EVERY FUNCTION ONWARDS) ↓ ------------------

const taskForm = document.getElementById("taskForm");
const editTaskName = document.getElementById("editTaskName");
const url = "http://localhost:3000";


// ----------------------------------------- ↓ GENERAL FUNCTIONS ↓ -----------------------------------------

function resetForm() {
    taskForm.reset();
}


// ----------------------------- ↓ GENERAL EVENT LISTENERS (TRIGGERS) ↓ ---------------------------------

const sortButton = document.getElementById("sortSelect");

window.addEventListener("DOMContentLoaded", () => {
    sortButton.value = "default"; // Reset the sort select to default on page load
});

sortButton.addEventListener("change", () => {
    displayTasks();
});

window.addEventListener("DOMContentLoaded", () => {
    displayTasks();
});


// ----------------------------- ↓ EVENT LISTENERS (TRIGGERS) FOR TASKS ↓ ---------------------------------

// To be used for all event listeners for  each task action
const toDoList = document.getElementById("toDoList");
const completedList = document.getElementById("completedList");


// To create a task on form submission
taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    createNewTask();
});


// To complete a task
toDoList.addEventListener("click", (event) => {
    if (event.target.classList.contains("done")) {
        const taskItem = event.target.getAttribute("data-id");
        completeTask(taskItem);
    }
});


// To mark a task as not completed
completedList.addEventListener("click", (event) => {
    if (event.target.classList.contains("notDone")) {
        const taskItem = event.target.getAttribute("data-id");
        taskNotComplete(taskItem);
    }
});


// Deleting a task
[toDoList, completedList].forEach(list => {
    list.addEventListener("click", (event) => {
        if (event.target.classList.contains("delete")) {
            const taskItem = event.target.getAttribute("data-id");
            deleteTask(taskItem);
        }
    });
});


// Editing the task
toDoList.addEventListener("click", (event) => {
    if (event.target.classList.contains("edit")) {
        const taskItem = event.target.getAttribute("data-id");
        const taskTitle = event.target.getAttribute("data-title");
        const taskDescription = event.target.getAttribute("data-description");
        const taskDueDate = new Date(event.target.getAttribute("data-due-date"));

        const editTaskName = document.getElementById("editTaskName");
        const editTaskDescription = document.getElementById("editTaskDescription");
        const editDueDate = document.getElementById("editDueDate");
        const saveChangesButton = document.getElementById("saveChangesButton");

        editTaskName.value = taskTitle;
        editTaskDescription.value = taskDescription;

        // This is to convert the date format back to the ISO 8601 standard so that is able to be read by <input type="date">
        const formattedDueDate = taskDueDate.toISOString().split("T")[0];

        editDueDate.value = formattedDueDate;

        saveChangesButton.addEventListener("click", async () => {
            await editTask(taskItem);

            const editTaskModal = bootstrap.Modal.getInstance(document.getElementById("editTaskWindow"));
            editTaskModal.hide();
        }, { once: true });
        
    }
});


// --------------------------------------------- ↓ TASK FUNCTIONS ↓ ---------------------------------------------


// ------------------------Get Tasks ------------------------------------
async function displayTasks() {
    try {

        const sortSelect = document.getElementById("sortSelect");
        const sortBy = sortSelect.value; //duedate, createdOn, title, default

        let query = "";
        if (sortBy !== "default") {
            query = `?sortBy=${sortBy}`;
        }

        const response = await fetch(`${url}/tasks${query}`);
        const data = await response.json();

        function formatTask(task) {
            const li = document.createElement("li");
            li.classList.add("p-3", "shadow-sm", "mt-2", "card");
            li.innerHTML = !task.completed ?
            // how we are displaying COMPLETED tasks?
            `
            <div class="d-flex justify-content-between align-items-start">
                <h4 class="col-11">${task.title}</h4>
                <button data-id="${task._id}" type="button" class="btn-close delete" aria-label="Close"></button>
            </div>
            <p>${task.description}</p>
            <p><Strong>Due: </Strong>${new Date(task.dueDate).toLocaleDateString()}</p>
            <div class="d-flex justify-content-between align-items-end">
                <div>
                    <button data-id="${task._id}" data-title="${task.title}" data-description="${task.description}" data-due-date="${task.dueDate}" data-bs-toggle="modal" data-bs-target="#editTaskWindow" class="btn btn-dark shadow-sm edit" type="button">Edit</button>
                    <button data-id="${task._id}" type="button" class="btn btn-dark shadow-sm done">Done</button>
                </div>
                <p class="m-0"><Strong>Created on: </Strong>${new Date(task.createdOn).toLocaleDateString()}</p>
            </div>
            `
            :
            // how are we displaying the tasks that aren't completed?
            `
            <div class="d-flex justify-content-between align-items-start">
                <h4 class="col-11 text-decoration-line-through opacity-50">${task.title}</h4>
                <button data-id="${task._id}" type="button" class="btn-close delete" aria-label="Close"></button>
            </div>
            <p class="text-decoration-line-through opacity-50">${task.description}</p>
            <p class="text-decoration-line-through opacity-50"><Strong>Due: </Strong>${new Date(task.dueDate).toLocaleDateString()}</p>
            <div class="d-flex justify-content-between align-items-end">
                <div>
                    <button data-id="${task._id}" type="button" class="btn btn-dark shadow-sm notDone">Not done</button>
                </div>
                <p class="m-0 text-decoration-line-through opacity-50"><Strong>Created on: </Strong>${new Date(task.createdOn).toLocaleDateString()}</p>
            </div>
            `;
            return li;
        }

        toDoList.innerHTML = "";
        completedList.innerHTML = "";

        const tasks = data;

        tasks.forEach(task => {
            task.completed ? completedList.appendChild(formatTask(task)) : toDoList.appendChild(formatTask(task));
        });

        resetForm();

    } catch (error) { 
        console.error("Error:", error);  
    }            

}
    displayTasks();


// ------------------------Create Task ------------------------------------
async function createNewTask() {
    try {
        const taskDetails = {
            title: document.getElementById("taskName").value.trim(),
            description: document.getElementById("taskDescription").value.trim(),
            dueDate: document.getElementById("dueDate").value.trim(),
        }

        if (!taskDetails.title || !taskDetails.description || !taskDetails.dueDate) {
            return alert("All fields required.");
        }

        const response = await fetch(`${url}/tasks/todo`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(taskDetails)
        });

        if (!response.ok) {
            throw new Error(`Failed to create task! : ${response.status}`);
        }

        const data = await response.json();
        console.log("New task created:", data);
        displayTasks();

    } catch (error) { 
        console.error("Error:", error);  
    }
}



// ------------------------Complete Task ------------------------------------
async function completeTask(taskId) {
    console.log("Task ID to complete:");
try {
    const response = await fetch(`${url}/tasks/complete/${taskId}`, {
        method: 'PATCH',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ completed: true })
    });

    if (!response.ok) {
        throw new Error(`Failed to complete task! : ${response.status}`);
    }

    const data = await response.json();

    console.log("Task completed:", data);

    displayTasks();

} catch (error) {
    console.error("Error:", error);
    }
    
}


// ------------------------To NOT complete a task ------------------------------------
async function taskNotComplete(taskId) {
try {
    const response = await fetch(`${url}/tasks/notComplete/${taskId}`, {
        method: 'PATCH',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ completed: false })
    });

    if (!response.ok) {
        throw new Error(`Failed to set the task to not complete: ${response.status}`);
    }

    const data = await response.json();
    console.log("Task set to not completed:", data);
    displayTasks();

} catch (error) {
    console.error("Error:", error);
    }
}





// ------------------------Deletin a Task ------------------------------------
async function deleteTask(taskId) {
try {
        const response = await fetch(`${url}/tasks/delete/${taskId}`, {
            method: 'DELETE',
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to delete task! : ${response.status}`);
        }
        const data = await response.json();

        console.log("Task deleted:", data);
        displayTasks();
        
} catch (error) {
    console.error("Error:", error);
    }
    
}





// Enable editing of the task
async function editTask(taskId) {

    const updatedTitle = editTaskName.value;
    const updatedDescription = editTaskDescription.value;
    const updatedDueDate = editDueDate.value;

    const updatedDetails = {
        title: updatedTitle,
        description: updatedDescription,
        dueDate: updatedDueDate
    }

    try {
        const response = await fetch(`${url}/tasks/update/${taskId}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedDetails)
        });

        if (!response.ok) {
            throw new Error(`Failed to edit task! : ${response.status}`);
        }

        const data = await response.json();
        console.log("Edited Task:", data);
        displayTasks();

    } catch (error) {
        console.error("Error:", error);
    }

}
















// API Example
/*async function getExample () {
    const response = await fetch('http://localhost:3000/get/example');
    const data = await response.text();

    window.alert(data);
}
getExample();
*/

