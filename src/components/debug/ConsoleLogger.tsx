'use client';

import { useEffect, useState } from 'react';

interface LogEntry {
  id: number;
  timestamp: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
}

export default function ConsoleLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let logId = 0;

    const addLog = (type: LogEntry['type'], args: unknown[]) => {
      const message = args
        .map((arg) =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(' ');

      const timestamp = new Date().toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      });

      setLogs((prev) => [
        ...prev.slice(-99), // Храним последние 100 логов
        { id: logId++, timestamp, type, message },
      ]);
    };

    // Сохраняем оригинальные методы
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    // Перехватываем console методы
    console.log = (...args: unknown[]) => {
      originalLog(...args);
      addLog('log', args);
    };

    console.warn = (...args: unknown[]) => {
      originalWarn(...args);
      addLog('warn', args);
    };

    console.error = (...args: unknown[]) => {
      originalError(...args);
      addLog('error', args);
    };

    console.info = (...args: unknown[]) => {
      originalInfo(...args);
      addLog('info', args);
    };

    // Восстанавливаем оригинальные методы при размонтировании
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 z-50"
      >
        Показать консоль
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-0 right-0 bg-black/95 text-white font-mono text-xs z-50 shadow-2xl border-t-2 border-gray-700 ${
        isMinimized ? 'h-12' : 'h-96'
      } w-full md:w-2/3 lg:w-1/2 transition-all duration-300`}
    >
      {/* Заголовок */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-green-400">●</span>
          <span className="font-semibold">Console Logger</span>
          <span className="text-gray-400">({logs.length})</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setLogs([])}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            title="Очистить"
          >
            Очистить
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            title={isMinimized ? 'Развернуть' : 'Свернуть'}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            title="Скрыть"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Логи */}
      {!isMinimized && (
        <div className="overflow-y-auto h-[calc(100%-3rem)] p-2 space-y-1">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              Логи будут отображаться здесь...
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`p-2 rounded border-l-4 ${
                  log.type === 'error'
                    ? 'bg-red-900/20 border-red-500'
                    : log.type === 'warn'
                      ? 'bg-yellow-900/20 border-yellow-500'
                      : log.type === 'info'
                        ? 'bg-blue-900/20 border-blue-500'
                        : 'bg-gray-800/50 border-gray-600'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 text-[10px] whitespace-nowrap">
                    {log.timestamp}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase ${
                      log.type === 'error'
                        ? 'text-red-400'
                        : log.type === 'warn'
                          ? 'text-yellow-400'
                          : log.type === 'info'
                            ? 'text-blue-400'
                            : 'text-green-400'
                    }`}
                  >
                    {log.type}
                  </span>
                </div>
                <pre className="mt-1 whitespace-pre-wrap break-words text-gray-100">
                  {log.message}
                </pre>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
