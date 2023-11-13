import React, { useEffect, useRef } from 'react';
import { Button } from 'antd';

const MyComponent: React.FC = () => {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 创建 WebSocket 连接
    ws.current = new WebSocket('ws://localhost:3000');

    // 监听连接事件
    ws.current.onopen = () => {
      console.log('WebSocket 已连接');
    };

    // 监听消息事件
    ws.current.onmessage = (event) => {
      console.log('收到消息:', event.data);
    };

    // 监听关闭事件
    ws.current.onclose = () => {
      console.log('WebSocket 已关闭');
    };

    // 在组件卸载时关闭 WebSocket 连接
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  // 发送消息
  const sendMessage = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send('Hello WebSocket!');
    }
  };

  return (
    <div>
      <Button onClick={sendMessage}>发送消息</Button>
    </div>
  );
};

export default MyComponent;