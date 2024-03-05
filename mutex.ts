// // 改进lock 在一个病人的所有操作做完后在key中删除这个病人visit_id

// export class Lock {

//   private previousActions: { [id: string]: Promise<void> } = {};

//   lock(visit_id: string, action: () => Promise<void>): Promise<void> {

//     const previousAction = this.previousActions[visit_id] ?? Promise.resolve()

//     return (this.previousActions[visit_id] = previousAction.then(() => action()))

//   }

// }

/**改进lock 在一个病人的所有操作做完后在 taskQueueMap 的key中删除这个病人visit_id */

export class Mutex {
  private taskQueueMap: Record<string, (() => Promise<void>)[]> = {};

  lock(id: string, action: () => Promise<void>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // 检查 visit_id 对应的任务数组是否存在，如果不存在则创建一个新的数组

      if (!this.taskQueueMap[id]) {
        this.taskQueueMap[id] = [];
      }

      // 将任务添加到任务数组中

      this.taskQueueMap[id].push(async () => {
        try {
          await action();

          resolve();
        } catch (error) {
          reject(error);
        } finally {
          this.taskQueueMap[id].shift();

          if (this.taskQueueMap[id].length > 0) {
            // 执行下一个任务

            const nextTask = this.taskQueueMap[id][0];

            nextTask();
          } else {
            delete this.taskQueueMap[id];
          }
        }
      });

      // 如果当前任务是队列中的第一个任务，则立即执行

      if (this.taskQueueMap[id].length === 1) {
        const currentTask = this.taskQueueMap[id][0];

        currentTask();
      }
    });
  }
}
