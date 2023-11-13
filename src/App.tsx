import React, {useEffect, useState, useRef} from 'react';
import type { InputRef, TableColumnsType } from 'antd';
import {Table, Form, Button, Input, Checkbox, Switch, message, Space, Drawer} from 'antd';
import {v4 as uuidv4} from 'uuid';
import TextArea from 'antd/es/input/TextArea';


interface MHeaderType {
  key: React.Key;
  golds: number;
  wld: string;    // win & lose & draw
  cattle: number;
  stake_count: number;
  stake_golds: number;
  current_golds: number;
  max_times: number;
  name: string;
  redp: string;
  current_count: number;
}

interface MBodyType {
  key?: React.Key;
  name: string;
  golds: number;
  current_golds: number;
  chat: number;
  cattle: number;
  redp: string;
  isfake?: boolean;
  islazy?: boolean;
  isbug?: boolean;
}

type MDataSourceType = {
  header: MHeaderType;
  body: MBodyType[];
}

const App: React.FC = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState<MDataSourceType[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState(['']);
  const [messageApi, contextHolder] = message.useMessage();
  const [dropen, setDropen] = useState(false);
  const [port, setPort] = useState('8080');
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const onDrClose = () => {
    setDropen(false);
  }
  
  const onClickByOk = () => {
    let p = myInput.current?.input?.value.trim();
    if (p) {
      console.log("set");
      setPort(p);
    }
  }

  const myInput = useRef<InputRef>(null);
  
  useEffect(() => {
    const newSocket = new WebSocket(`ws://localhost:${port}`);
    setSocket(newSocket);
    newSocket.onopen = () => {
      console.log("onopen");
      setDropen(false);

      newSocket.send(JSON.stringify({
        code: 0,
        type: "web_login",
        msg: {
          device_name: window.location.host,
          time: Date.now()
        }
      }));
    
      
      newSocket.send(JSON.stringify({
        code: 10,
        type: "web_say",
        call: "getGameData",
        para: []
      }));
    
    
      newSocket.send(JSON.stringify({
        code: 10,
        type: "web_say",
        call: "getHomeUI",
        para: [],
      }));
    }
    
    newSocket.onmessage = (e: MessageEvent) => {
      console.log("onmessage");
      let data = JSON.parse(e.data);
      if (!data) return;
      switch (data.code) {
        case 0:
          break;
        case 10:
          switch(data.call) {
            case "getGameData":
              for(let j = 0; j < data.data.length;j++) {
                data.data[j].header.key = uuidv4();
                for (let i = 0; i < data.data[j].body.length; i++) {
                  data.data[j].body[i].key = i.toString();
                }
                setData(preData => [...preData, data.data[j]]);
                setExpandedRowKeys([data.data[j].header.key.toString()]);   // 设置最新的数据展开
              }
              break;
            case "getHomeUI":
              console.log("GetHomeUI");
              console.log(data.data);
              form.setFieldsValue(data.data);
              break;
            case "getGameDataCurrent":
              data.data.header.key = uuidv4();
              for (let i = 0;i < data.data.body.length;i++) {
                data.data.body[i].key = i.toString();
              }
              setData(preData => [...preData, data.data]);
              setExpandedRowKeys([data.data.header.key.toString()]);
              break;
          }
          break;
      }
    
    }
    
    newSocket.onclose = () => {
      console.log("onclose");
      messageApi.error("服务器连接断开");
      socket?.send(JSON.stringify({
        code: 0,
        type: "web_exit",
        msg: {
          device_name: window.location.host,
          time: Date.now()
        }
      }));
    }
    
    newSocket.onerror = () => {
      console.log("onerror");
      messageApi.error("服务器连接失败");
      setDropen(true);
    }
    
    window.addEventListener("beforeunload", () => {
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    });

    return () => {
      console.log("onret");
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
      window.removeEventListener("beforeunload", () => {
        if (newSocket.readyState === WebSocket.OPEN) {
          newSocket.close();
        }
      });
    }
  }, [port]);

  const startScript = function(checked: boolean) {
    if (checked) {
      console.log("开始脚本");
      socket?.send(JSON.stringify({
        code: 10,
        type: "web_say",
        call: "changeCheckRunscriptByWeb",
        para: [true],
      }));
    } else {
      console.log("停止脚本");
      socket?.send(JSON.stringify({
        code: 10,
        type: "web_say",
        call: "changeCheckRunscriptByWeb",
        para: [false],
      }));
    }
  }
  
  const onFinish = (values: any) => {
    console.log(values);
    // 发送
    values.home_radio = true;
    values.list_radio = false;
    socket?.send(JSON.stringify({
      code: 10,
      type: "web_say",
      call: "setHomeUI",
      para: [values]
    }));
  }

  const expandedRowRender = (_:any, index: number) => {
    // 二层数据类型
    const columns: TableColumnsType<MBodyType> = [
      { title: '总单', dataIndex: 'golds', key: 'golds' },
      { title: '微信名', dataIndex: 'name', key: 'name' },
      { title: '押注/收', dataIndex: 'chat', key: 'chat' },
      { title: '红包点数', dataIndex: 'redp', key: 'redp' },
      { title: '本局结算', dataIndex: 'current_golds', key: 'current_golds' },
    ];
    return <Table columns={columns} dataSource={data[index].body} pagination={false} />;
  };
  const onExpand = (expanded: boolean, record: any) => {
    console.log("展开");
    if (expanded) {
      setExpandedRowKeys([...expandedRowKeys, record.key]);
    } else {
      setExpandedRowKeys(expandedRowKeys.filter(key => key !== record.key))
    }
  };
  const pagintaionConfig = {
    pageSize: 10,
    showSizeChanger: true,
  };
  // 一层数据类型
  const columns: TableColumnsType<MHeaderType> = [
    { title: '总单', dataIndex: 'golds', key: 'golds'},
    { title: '输/赢/平', dataIndex: 'wld', key: 'wld' },
    { title: '押注总计', dataIndex: 'stake_count', key: 'stake_count' },
    { title: '押注累计', dataIndex: 'stake_golds', key: 'stake_golds' },
    { title: '本局输赢', dataIndex: 'current_golds', key: 'current_golds' },
    { title: '最大押注', dataIndex: 'max_times', key: 'max_times' },
    { title: '庄家名称', dataIndex: 'name', key: 'name' },
    { title: '装家红包', dataIndex: 'redp', key: 'redp' },
    { title: '本局局数', dataIndex: 'current_count', key: 'current_count', defaultSortOrder: 'descend',sorter: (a, b) => a.current_count - b.current_count,},
  ];
  // const defaultSortOrder = '';

  return (
    <>
      {contextHolder}
      <Form
        layout={'inline'}
        form={form}
        name="control-hooks"
        onFinish={onFinish}
        initialValues={{ is_multiple: true, is_draw: false, check_timeout: 6, max_times: 9999, boss_name: '', friend: ''}}
        style={{ }}
      >
        <Form.Item label="庄家名字" name="boss_name">
          <Input placeholder="请输入庄的名字" />
        </Form.Item>
        <Form.Item label="最高下注" name="max_times">
          <Input placeholder="请输入最高下注" />
        </Form.Item>
        <br/>
        <Form.Item label="机器人超时" name="check_timeout">
          <Input placeholder="" />
        </Form.Item>
        <Form.Item label="自己人" name="friend">
          <TextArea rows={3}></TextArea>
        </Form.Item>
        <Form.Item name="is_multiple" valuePropName='checked'>
          <Checkbox>翻倍模式</Checkbox>
        </Form.Item>
        <Form.Item name="is_draw" valuePropName='checked'>
          <Checkbox>一点庄吃</Checkbox>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType='submit'>保存配置</Button>
        </Form.Item>
      </Form>
      
      <Form
        layout='inline'
        style={{ marginBottom: 16 , float: 'right'}}
      >
        <Form.Item label="手动采集">
          <Switch onChange={startScript}></Switch>
        </Form.Item>
        <Form.Item label="自动核账">
          <Switch ></Switch>
        </Form.Item>
      </Form>
      <Table
        columns={columns}
        // sortDirections={['descend']}
        expandable={{ expandedRowRender, expandedRowKeys, onExpand}}
        dataSource={data.map((item) => item.header)}
        pagination={pagintaionConfig}
      />
      <Drawer
        title="全局设置"
        placement='bottom'
        onClose={onDrClose}
        closable={false}
        open={dropen}
        >
          <Space.Compact style={{width: '100%'}}>
            <Input ref={myInput} defaultValue={"8080"} placeholder='请输入端口号' ></Input>
            <Button type='primary' onClick={onClickByOk}>确认</Button>
          </Space.Compact>
      </Drawer>
    </>
  );
};

export default App;
