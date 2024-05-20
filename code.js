const token = "";
const webAppUrl = "";
const table = SpreadsheetApp.openById("");

function setWebhook() {
  const result = UrlFetchApp.fetch(
    `https://api.telegram.org/bot${token}/setWebhook?url=${webAppUrl}`
  );

  console.log(result.getContentText());
}

const debugPage = table.getSheetByName("Debug");
const todosPage = table.getSheetByName("Todos");
const langPage = table.getSheetByName("Language");
const debugLastRow = debugPage.getLastRow();
const todosLastRow = todosPage.getLastRow();
const langLastRow = langPage.getLastRow();
const startRow = 2;
const startColumn = 1;
const allRows = todosLastRow - startRow + 1;
const allColumnsWithDays = 14;
const allColumns = 6;
const idColumn = 2;
const userIdColumn = 3;
const importantColumn = 4;
const doneColumn = 5;
const deletedColumn = 6;
const IMPORTANT = "1";
const DONE = "2";
const DELETE = "3";
const UNIMPORTANT = "4";
const NOTIFICATION_DAY = "5";
const NOTIFICATION_TIME = "6";
const TODO_MARK = "9";
const tableDayShift = 6;
const maxTextLength = 30;

const weekDays = (lang) => {
  if (lang === "en") {
    return [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
  }
  return [
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
    "Воскресенье",
  ];
};

const Dictionary = {
  ru: {
    list: "Список дел",
    updateMenu: "Обновить меню",
    editList: "Редактировать список",
    allNotifications: "Все уведомления",
    main: "Главное меню",
    updatedMainMenu: "Главное меню обновлено",
    updatedTask: "Задача обновлена",
    language: "En-Ru",
    cleanAll: "Очистить все напоминания",
    everyDay: "Каждый день",
    addNotification: "Добавить напоминание",
    remove: "Удалить",
    done: "Сделано",
    markedImportant: "Задача помечена как 'Важная'",
    markedUnimportant: "Задача помечена как 'Неважная'",
    putToDone: "Задача перенесена в 'Выполненные'",
    taskRemoved: "Задача успешно удалена",
    taskSent: "Запрос отправлен",
    chooseDay:
      "Выберите день, в который хотите получать напоминание по этой задаче",
    chooseTime: "Выберите время, во сколько должно приходить напоминание",
    timeSet: "Время напоминания задано",
    allNotificationsRemoved: "Все напоминания удалены",
    hello: "Привет",
    sendTaskToBot:
      "Чтобы добавить новую задачу, отправьте боту название задачи. Максимально ",
    symbols: "символа.",
    emptyList: "Список уведомлений пуст",
    chooseTask:
      "Выберите задачу для редактирования. Для добавления новой задачи, просто отправьте боту название задачи",
    taskAdded: "Новая задача успешно добавлена",
    textLength: "Длина текста должна быть до ",
    symbols2: "символов.",
    textLength2: "Длина вашего текста ",
    mustRemove: "Необходимо убрать ",
    copyText: "Скопировать текст",
    updatedLanguage: "Язык приложения обновлен",
  },
  en: {
    list: "Todos",
    updateMenu: "Update menu",
    editList: "Edit list",
    allNotifications: "All notifications",
    main: "Main menu",
    updatedMainMenu: "Main menu was updated",
    updatedTask: "The task was updated",
    language: "En-Ru",
    cleanAll: "Clean all notifications",
    everyDay: "Every day",
    addNotification: "Add notification",
    remove: "Remove",
    done: "Done",
    markedImportant: "The task is marked as'Important'",
    markedUnimportant: "The task is marked as 'Unimportant'",
    putToDone: "The task is was moved to 'Done'",
    taskRemoved: "The task is successfully removed",
    taskSent: "The request is sent",
    chooseDay: "Choose the day to get notifications for this task",
    chooseTime: "Choose the time when notifications must come",
    timeSet: "The time is set",
    allNotificationsRemoved: "All notifications are removed",
    hello: "Hello",
    sendTaskToBot: "To add a new task, send it to the bot. Maximum ",
    symbols: "symbols.",
    emptyList: "The notifications list is empty",
    chooseTask:
      "Choose the task to edit. To add a new task, just send it to the bot",
    taskAdded: "A new task was successfully added",
    textLength: "The length of your text must be up to ",
    symbols2: "symbols.",
    textLength2: "The length of your text is ",
    mustRemove: "It's necessary to remove ",
    copyText: "Copy the text",
    updatedLanguage: "The language was updated",
  },
};

const keyboard = (lang) => {
  const dictionary = Dictionary[lang];
  return [
    [
      {
        text: "🔶 " + dictionary.list,
      },
      {
        text: "🔶 " + dictionary.updateMenu,
      },
      {
        text: "🔶 " + dictionary.editList,
      },
    ],
    [
      {
        text: "🟢 " + dictionary.allNotifications,
      },
      {
        text: "🟢 " + dictionary.language,
      },
    ],
  ];
};

const mainKeyboard = (lang) => ({
  keyboard: keyboard(lang),
  resize_keyboard: true,
});

const lang = "en";
const chat_id = "1127224992";

const content = {};

function doPost(e) {
  const content = JSON.parse(e.postData.contents);
  const query = content.callback_query;
  const message = query ? query.message : content.message;
  const text = query ? query.data : message.text;
  const pureText = text.replaceAll("🟢", "").replaceAll("🔶", "").trim();
  const { from, chat } = message;
  const chat_id = chat.id;
  const name = from.first_name;
  const username = from.username;

  console.log("pureText", pureText);

  debugPage.getRange(debugLastRow + 1, 1).setValue(chat_id);
  debugPage.getRange(debugLastRow + 1, 2).setValue(username);
  debugPage
    .getRange(debugLastRow + 1, 3)
    .setValue(JSON.stringify(content, null, 5));
  const inlineValues = pureText.split("_");
  const queryId = query ? query.id : "";
  const lang = getLanguage(chat_id);
  const dictionary = Dictionary[lang];

  if (inlineValues.length > 1) {
    const [type, id, day, time, name] = inlineValues;

    if (type == IMPORTANT) {
      markAsImportant(id);
      if (queryId) sendKeyboardCallback(queryId, dictionary.markAsImportant);
      sendKeyboard(chat_id, dictionary.updatedTask, mainKeyboard(lang));
    } else if (type == UNIMPORTANT) {
      markAsUnimportant(id);
      if (queryId) sendKeyboardCallback(queryId, dictionary.markAsUnimportant);
      sendKeyboard(chat_id, dictionary.updatedTask, mainKeyboard(lang));
    } else if (type == DONE) {
      markAsDone(id);
      if (queryId) sendKeyboardCallback(queryId, dictionary.putToDone);
      sendKeyboard(chat_id, dictionary.updatedTask, mainKeyboard(lang));
    } else if (type == DELETE) {
      markAsDeleted(id);
      if (queryId) sendKeyboardCallback(queryId, dictionary.taskRemoved);
      sendKeyboard(chat_id, dictionary.updatedTask, mainKeyboard(lang));
    } else if (type == NOTIFICATION_DAY) {
      if (queryId) sendKeyboardCallback(queryId, dictionary.taskSent);
      sendKeyboard(chat_id, dictionary.chooseDay, getDayKeyboard(id, lang));
    }
    // Каждый день
    else if (weekDays(lang).includes(type) || type === dictionary.everyDay) {
      if (queryId) sendKeyboardCallback(queryId, dictionary.taskSent);
      sendKeyboard(chat_id, dictionary.chooseTime, getTimeKeyboard(id, type));
    } else if (type === "day") {
      if (time && day) setTimer(id, day, time, lang);
      if (queryId) sendKeyboardCallback(queryId, dictionary.timeSet);
    }
    // Очистить все
    else if (type == dictionary.cleanAll) {
      cleanTimers(id);
      if (queryId)
        sendKeyboardCallback(queryId, dictionary.allNotificationsRemoved);
    } else if (type == TODO_MARK) {
      if (queryId) sendKeyboardCallback(queryId, dictionary.taskSent);
      const values = todosPage
        .getRange(startRow, 1, allRows, 1)
        .getValues()
        .flat()
        .map((el) => String(el));
      const row = values.indexOf(String(id));
      if (row) {
        const isImportant = todosPage
          .getRange(row + 2, importantColumn)
          .getValue();
        const keyboard = getInlineKeyboard(id, isImportant, lang);
        sendKeyboard(
          chat_id,
          getNotificationsInfo(chat_id, id, lang) || name,
          keyboard
        );
      }
    }
  } else if (pureText === "/start") {
    langPage.getRange(langLastRow + 1, 1).setValue(chat_id);
    langPage.getRange(langLastRow + 1, 2).setValue("ru");
    sendKeyboard(
      chat_id,
      `${dictionary.hello}, ${name}! ${dictionary.sendTaskToBot} ${maxTextLength} ${dictionary.symbols}.`,
      mainKeyboard(lang)
    );
    // Главное меню, Меню обновлено
  } else if (
    pureText === "/main" ||
    pureText === dictionary.main ||
    pureText === dictionary.updateMenu
  ) {
    sendKeyboard(chat_id, dictionary.main, mainKeyboard(lang));
    // Список дел
  } else if (pureText === dictionary.list) {
    const todos = getAllTodos(chat_id, true).join("\n");
    sendKeyboard(chat_id, todos, getEditKeyboard(lang));
    // Язык
  } else if (pureText === dictionary.language) {
    const newLang = changeLanguage(chat_id);
    sendKeyboard(chat_id, dictionary.updatedLanguage, mainKeyboard(newLang));
    // Все уведомления
  } else if (pureText === dictionary.allNotifications) {
    sendText(
      chat_id,
      getNotificationsInfo(chat_id, null, lang) || dictionary.emptyList
    );

    // Редактировать список
  } else if (pureText === dictionary.editList) {
    if (queryId) sendKeyboardCallback(queryId, dictionary.taskSent);
    sendKeyboard(chat_id, dictionary.chooseTask, getTodosKeyboard(chat_id));
  } else {
    if (pureText.length <= maxTextLength) {
      todosPage.getRange(todosLastRow + 1, 1).setValue(pureText);
      todosPage
        .getRange(todosLastRow + 1, 2)
        .setValue(Math.round(Math.random() * 1000000));
      todosPage.getRange(todosLastRow + 1, 3).setValue(chat_id);
      sendText(chat_id, dictionary.taskAdded, false);
    } else {
      const textLength = pureText.length;
      const left = maxTextLength - textLength;
      sendText(
        chat_id,
        `${dictionary.textLength} ${maxTextLength} ${dictionary.symbols2}.\n${
          dictionary.textLength2
        } ${textLength}\n${dictionary.mustRemove} ${Math.abs(left)}\n<u>${
          dictionary.copyText
        }</u>\n<code>${pureText}</code>`,
        false
      );
    }
  }
}

const getNotificationsInfo = (chat_id, taskId, lang) => {
  let todos = getAllTodosWithDays(chat_id);
  if (taskId) todos = todos.filter((el) => el[1] == +taskId);

  let text = "";
  todos.forEach((el) => {
    const weekDaysInfo = el.slice(6, 13);

    if (weekDaysInfo.filter((el) => el).length) {
      text += "<b>" + el[0] + "</b>" + ":\n";
      weekDaysInfo.forEach((time, ind) => {
        if (time) {
          text =
            text +
            weekDays(lang)[ind] +
            " - " +
            time +
            ".00-" +
            (time + 1) +
            ".00" +
            "\n";
        }
      });
    }
  });

  return text;
};

const getExtraButtons = (chat_id) => {
  const todos = getAllTodos(chat_id, true);
  const allRows = [];
  let row = [];
  let count = 0;

  todos.forEach((text) => {
    row.push({ text });
    count++;

    if (count === 4) {
      allRows.push(row);
      row = [];
      count = 0;
    }
  });

  if (row.length) {
    allRows.push(row);
    row = [];
    count = 0;
  }

  return allRows;
};

const getTodosKeyboard = (chat_id) => {
  const todos = getAllTodosWithIds(chat_id);
  const inline_keyboard = [];
  let row = [];
  let count = 0;

  todos.forEach(({ text, id }) => {
    row.push({
      text,
      callback_data: `${TODO_MARK}_${id}_0_0_${text}`,
    });
    count++;

    if (count === 2) {
      inline_keyboard.push(row);
      row = [];
      count = 0;
    }
  });

  if (row.length) {
    inline_keyboard.push(row);
    row = [];
    count = 0;
  }

  return {
    inline_keyboard,
    resize_keyboard: true,
  };
};

const getInlineKeyboard = (id, isImportant, lang) => {
  const dictionary = Dictionary[lang];
  return {
    inline_keyboard: [
      [
        {
          text: dictionary.done,
          callback_data: `${DONE}_${id}`,
        },
        {
          text: dictionary.remove,
          callback_data: `${DELETE}_${id}`,
        },
      ],
      [
        {
          text: dictionary.addNotification,
          callback_data: `${NOTIFICATION_DAY}_${id}`,
        },
        {
          text: dictionary.cleanAll,
          callback_data: `${dictionary.cleanAll}_${id}`,
        },
      ],
    ],
    resize_keyboard: true,
  };
};

const getEditKeyboard = (lang) => {
  const dictionary = Dictionary[lang];
  return {
    inline_keyboard: [
      [
        {
          text: dictionary.editList,
          callback_data: dictionary.editList,
        },
      ],
    ],
    resize_keyboard: true,
  };
};

const getDayKeyboard = (id, lang) => {
  const dictionary = Dictionary[lang];
  const weekdays = weekDays(lang);
  return {
    inline_keyboard: [
      [
        {
          text: weekdays[0],
          callback_data: `${weekdays[0]}_${id}`,
        },
        {
          text: weekdays[4],
          callback_data: `${weekdays[4]}_${id}`,
        },
      ],
      [
        {
          text: weekdays[1],
          callback_data: `${weekdays[1]}_${id}`,
        },
        {
          text: weekdays[5],
          callback_data: `${weekdays[5]}_${id}`,
        },
      ],
      [
        {
          text: weekdays[2],
          callback_data: `${weekdays[2]}_${id}`,
        },
        {
          text: weekdays[6],
          callback_data: `${weekdays[6]}_${id}`,
        },
      ],
      [
        {
          text: weekdays[3],
          callback_data: `${weekdays[3]}_${id}`,
        },
        {
          text: dictionary.everyDay,
          callback_data: `${dictionary.everyDay}_${id}`,
        },
      ],
    ],
    resize_keyboard: true,
  };
};

const getTimeKeyboard = (id, day) => {
  return {
    inline_keyboard: [
      [
        {
          text: "06.00-07.00",
          callback_data: `day_${id}_${day}_${6}`,
        },
        {
          text: "12.00-13.00",
          callback_data: `day_${id}_${day}_${12}`,
        },
        {
          text: "18.00-19.00",
          callback_data: `day_${id}_${day}_${18}`,
        },
      ],
      [
        {
          text: "07.00-08.00",
          callback_data: `day_${id}_${day}_${7}`,
        },
        {
          text: "13.00-14.00",
          callback_data: `day_${id}_${day}_${13}`,
        },
        {
          text: "19.00-20.00",
          callback_data: `day_${id}_${day}_${19}`,
        },
      ],
      [
        {
          text: "08.00-09.00",
          callback_data: `day_${id}_${day}_${8}`,
        },
        {
          text: "14.00-15.00",
          callback_data: `day_${id}_${day}_${14}`,
        },
        {
          text: "20.00-21.00",
          callback_data: `day_${id}_${day}_${20}_`,
        },
      ],
      [
        {
          text: "09.00-10.00",
          callback_data: `day_${id}_${day}_${9}`,
        },
        {
          text: "15.00-16.00",
          callback_data: `day_${id}_${day}_${15}`,
        },
        {
          text: "21.00-22.00",
          callback_data: `day_${id}_${day}_${21}`,
        },
      ],
      [
        {
          text: "10.00-11.00",
          callback_data: `day_${id}_${day}_${10}`,
        },
        {
          text: "16.00-17.00",
          callback_data: `day_${id}_${day}_${16}`,
        },
        {
          text: "22.00-23.00",
          callback_data: `day_${id}_${day}_${22}`,
        },
      ],
      [
        {
          text: "11.00-12.00",
          callback_data: `day_${id}_${day}_${11}`,
        },
        {
          text: "17.00-18.00",
          callback_data: `day_${id}_${day}_${17}`,
        },
        {
          text: "23.00-00.00",
          callback_data: `day_${id}_${day}_${23}`,
        },
      ],
    ],
    resize_keyboard: true,
  };
};

function sendText(chat_id, text, remove_keyboard) {
  const data = {
    method: "POST",
    payload: {
      method: "sendMessage",
      chat_id: String(chat_id),
      text,
      parse_mode: "HTML",
      reply_markup: JSON.stringify({ remove_keyboard }),
    },
  };

  UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/`, data);
}

function sendNotification() {
  const AnnsId = "413466278";
  const todos = getAllTodos(AnnsId, true).join("\n");

  if (todos.length) {
    const text = `<u>ToDos:</u>\n${todos}`;

    const data = {
      method: "POST",
      payload: {
        method: "sendMessage",
        chat_id: String(AnnsId),
        text,
        parse_mode: "HTML",
      },
    };
    UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/`, data);
  }
}

function sendWeeklyNotification() {
  let todos = getAllTodosForNotifications();
  const currentDate = new Date();
  const currentDay = currentDate.getDay() + tableDayShift;
  const currentHour = currentDate.getHours();

  todos = todos.filter(
    (el) =>
      el[currentDay - 1] && String(currentHour) === String(el[currentDay - 1])
  );

  if (todos.length) {
    const allUserIds = [...todos].map((el) => el[userIdColumn - 1]);
    const userIds = [];
    allUserIds.forEach((el) =>
      !userIds.includes(el) ? userIds.push(el) : null
    );

    userIds.forEach((id) => {
      const readyTodos = todos
        .filter((el) => {
          if (String(el[userIdColumn - 1]) === String(id)) {
            return true;
          } else {
            return false;
          }
        })
        .map((el) => "🟢 " + el[0])
        .join("\n");
      const text = `<u>ToDos:</u>\n${readyTodos}`;
      const data = {
        method: "POST",
        payload: {
          method: "sendMessage",
          chat_id: String(id),
          text,
          parse_mode: "HTML",
        },
      };
      UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/`, data);
    });
  }
}

function sendKeyboard(chat_id, text, keyboard) {
  const data = {
    method: "POST",
    payload: {
      method: "sendMessage",
      chat_id: String(chat_id),
      text: text,
      parse_mode: "HTML",
      reply_markup: JSON.stringify(keyboard),
    },
  };

  UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/`, data);
}

function sendKeyboardCallback(queryId, text) {
  const data = {
    method: "POST",
    payload: {
      method: "answerCallbackQuery",
      callback_query_id: queryId,
      text: text,
    },
  };

  UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/`, data);
}

function getAllTodos(chat_id, active, important) {
  let values = todosPage
    .getRange(startRow, startColumn, allRows, allColumns)
    .getValues()
    .filter((el) => el[userIdColumn - 1] == chat_id);

  if (active) {
    values = values
      .filter((el) => !el[doneColumn - 1])
      .filter((el) => !el[deletedColumn - 1]);
  }

  if (important) {
    values = values.filter((el) => el[importantColumn - 1]);
  }

  values = values.map((el) => "🟢 " + el[0]);

  return values;
}

function getLanguage(chat_id) {
  const lang = langPage
    .getRange(3, startColumn, allRows, 2)
    .getValues()
    .filter((el) => el[0] == chat_id)
    .flat()[1];
  return lang;
}

function changeLanguage(chat_id) {
  const rows = langPage.getRange(3, startColumn, allRows, 1).getValues().flat();
  const row = rows.indexOf(+chat_id);
  const lang = langPage.getRange(row + 3, 2, 1, 1).getValue();
  const newLang = lang == "ru" ? "en" : "ru";
  langPage.getRange(row + 3, 2, 1, 1).setValue(newLang);
  return newLang;
}

function getAllTodosWithDays(chat_id) {
  return todosPage
    .getRange(startRow, startColumn, allRows, allColumnsWithDays)
    .getValues()
    .filter((el) => el[userIdColumn - 1] == chat_id)
    .filter((el) => !el[doneColumn - 1])
    .filter((el) => !el[deletedColumn - 1]);
}

function getAllTodosForNotifications() {
  return todosPage
    .getRange(startRow, startColumn, allRows, allColumnsWithDays)
    .getValues()
    .filter((el) => !el[doneColumn - 1])
    .filter((el) => !el[deletedColumn - 1]);
}

function getAllTodosWithIds(chat_id) {
  return todosPage
    .getRange(startRow, startColumn, allRows, allColumnsWithDays)
    .getValues()
    .filter((el) => el[userIdColumn - 1] == chat_id)
    .filter((el) => !el[doneColumn - 1])
    .filter((el) => !el[deletedColumn - 1])
    .map((el) => ({ text: el[0], id: el[1] }));
}

const getAllIds = () =>
  todosPage.getRange(startRow, idColumn, allRows, 1).getValues().flat();

const getRowNumber = (todoId) => {
  const values = getAllIds();
  const row = values.indexOf(+todoId);

  return row;
};

const markAsImportant = (todoId) => {
  const row = getRowNumber(todoId);

  if (row) {
    todosPage.getRange(row + 2, importantColumn).setValue(true);
  }
};

const markAsUnimportant = (todoId) => {
  const row = getRowNumber(todoId);

  if (row) {
    todosPage.getRange(row + 2, importantColumn).setValue(false);
  }
};

const markAsDone = (todoId) => {
  const row = getRowNumber(todoId);

  if (row) {
    todosPage.getRange(row + 2, doneColumn).setValue(true);
  }
};
const markAsDeleted = (todoId) => {
  const row = getRowNumber(todoId);

  if (row) {
    todosPage.getRange(row + 2, deletedColumn).setValue(true);
  }
};

const setTimer = (todoId, day, time, lang) => {
  const row = getRowNumber(todoId);
  const value = time.split(".")[0];
  const dictionary = Dictionary[lang];

  if (day === dictionary.everyDay) {
    if (row) {
      for (let i = 7; i < 14; i++) {
        todosPage.getRange(row + 2, i).setValue(value);
      }
    }
  } else {
    const column = weekDays(lang).indexOf(day) + tableDayShift + 1;

    if (row) {
      todosPage.getRange(row + 2, column).setValue(value);
    }
  }
};

const cleanTimers = (todoId) => {
  const row = getRowNumber(todoId);

  if (row) {
    for (let i = 7; i < 14; i++) {
      todosPage.getRange(row + 2, i).setValue("");
    }
  }
};
