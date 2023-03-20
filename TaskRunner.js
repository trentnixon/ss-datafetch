// Update Progress
const sendAPIRequest = require("./utils/UpdateTaskRunnerProgress");

class FullUpdateTaskRunner {
    constructor(FranchiseID, FULLUPDATE) {
      this.FranchiseID = FranchiseID || 8;
      this.tasks = FULLUPDATE;
      this.taskIndex = 0;
      this.totalTasks = this.tasks.length;
      this.startTime = null;
    }
  
    async start() {
      // Get the Unix time before starting the tasks
      this.startTime = Date.now();
  
      try {
        while (this.taskIndex < this.totalTasks) {
          // Get the current task
          const { name, description, func } = this.tasks[this.taskIndex];
  
          // Send an API request to let the server know that the task is starting
          await sendAPIRequest({
            UpdateStatus: description,
            UpdateProgress: Math.round((this.taskIndex / this.totalTasks) * 100),
            _ID: this.FranchiseID,
            isUpdating: true,
          });
  
          // Get the Unix time before running the task
          const taskStartTime = Date.now();
  
          // Run the task
          const TaskStatus = await func(this.FranchiseID);
  
          // Get the Unix time after running the task
          const taskEndTime = Date.now();
  
          // Calculate the duration of the task
          const taskDuration = taskEndTime - taskStartTime;
  
          // Check if the task completed successfully
          if (TaskStatus.status === true) {
            console.log(
              `${name} task completed successfully (duration: ${taskDuration}ms)`
            );
  
            // Send an API request to let the server know that the task is finished
            await sendAPIRequest({
              UpdateStatus: description,
              UpdateProgress: Math.round((this.taskIndex / this.totalTasks) * 100),
              totalDuration: taskDuration,
              _ID: this.FranchiseID,
              isUpdating: true,
            });
  
            this.taskIndex++;
          } else {
            console.error(
              `${name} task encountered an error: ${TaskStatus.error}`
            );
            await sendAPIRequest({
              UpdateStatus: `ERROR : ${TaskStatus.error}`,
              UpdateProgress: Math.round((this.taskIndex / this.totalTasks) * 100),
              totalDuration: taskDuration,
              _ID: this.FranchiseID,
              isUpdating: false,
            });
            throw new Error(`${name} task encountered an error: ${TaskStatus.error}`);
          }
        }
  
        // Get the Unix time after all tasks are completed
        const endTime = Date.now();
  
        // Calculate the total duration of the task runner
        const totalDuration = endTime - this.startTime;
  
        // Send an API request to let the server know that all tasks are finished
        await sendAPIRequest({
          UpdateStatus: "Completed",
          UpdateProgress: Math.round((this.taskIndex / this.totalTasks) * 100),
          totalDuration: totalDuration,
          _ID: this.FranchiseID,
          isUpdating: false,
          LastUpdate: this.startTime,
        });
  
        return `All tasks completed successfully (total duration: ${totalDuration}ms)`;
      } catch (error) {
        // Handle any errors that occur during the tasks
        const endTime = Date.now();
  
        // Calculate the total duration of the task runner
        const totalDuration = endTime - this.startTime;
        await sendAPIRequest({
          UpdateStatus: `ERROR: ${error}`,
          UpdateProgress: Math.round((this.taskIndex / this.totalTasks) * 100),
          totalDuration: totalDuration,
          _ID: this.FranchiseID,
          isUpdating: false,
        });
        console.log("FullUpdateTaskRunner Error catch")
        console.log(error);
    res.status(500).send("An error occurred while running the tasks");
  }
}
}


module.exports = FullUpdateTaskRunner