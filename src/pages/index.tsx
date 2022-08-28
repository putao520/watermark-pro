import React, { useState, useReducer, useMemo } from 'react';
import { Button, Upload, message } from 'antd';
import { ArrowDownOutlined, PlusOutlined } from '@ant-design/icons';
import FormRender, { useForm } from 'form-render';
import JSZip from 'jszip';
import { useSize } from 'ahooks';
import { saveAs } from 'file-saver';
import confetti from 'canvas-confetti';

import { Scaler, useScaler } from '@/components/Scaler';
import Watermark from '@/components/Watermark';
import Control from '@/components/Control';
import HotKey from '@/components/HotKey';

import { getBase64 } from '@/untils';

import ImgCrop from 'antd-img-crop';
import 'antd/es/modal/style';
import 'antd/es/slider/style';

import initialImage from '@/assets/watermark.jpg';
import '../../node_modules/pattern.css/dist/pattern.css';
import './index.css';

const schema = {
  type: 'object',
  properties: {
    text: {
      title: '文字',
      readOnly: false,
      required: false,
      default: '测试水印',
      props: {
        allowClear: false,
      },
      type: 'string',
    },
    fillStyle: {
      title: '颜色',
      readOnly: false,
      required: false,
      type: 'string',
      format: 'color',
      default: '#00000080',
    },
    fontSize: {
      title: '字体大小 (px)',
      readOnly: false,
      required: false,
      type: 'number',
      widget: 'slider',
      default: 26,
      min: 12,
      max: 64,
    },
    rotate: {
      title: '旋转度 (^)',
      readOnly: false,
      required: false,
      type: 'number',
      widget: 'slider',
      default: 20,
      min: 0,
      max: 45,
    },
    watermarkWidth: {
      title: '宽度 (px)',
      readOnly: false,
      required: false,
      type: 'number',
      widget: 'slider',
      default: 252,
      min: 100,
      max: 560,
    },
    watermarkHeight: {
      title: '高度 (px)',
      readOnly: false,
      required: false,
      type: 'number',
      widget: 'slider',
      default: 180,
      min: 100,
      max: 360,
    },
  },
  displayType: 'column',
};

const initalOptions = (() => {
  const object = schema.properties;
  let defaultObj = {} as any;
  for (const key in object) {
    defaultObj[key] = object[key].default;
  }
  return defaultObj;
})();

const initialState = {
  options: initalOptions,
  fileList: [
    /*
    {
      uid: '0',
      name: '水印示例.png',
      status: 'done',
      url: initialImage,
      preview: initialImage,
      originFileObj: '',
    },
    */
  ],
  current: 0,
  previewImage: initialImage,
  fileName: '水印示例.png',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_OPTIONS':
      return {
        ...state,
        options: action.payload,
      };
      break;
    case 'SET_CURRENT':
      return {
        ...state,
        current: action.payload,
      };
      break;
    default:
      throw new Error();
  }
}

export default function IndexPage() {
  const [{ options }, dispatch] = useReducer(reducer, initialState);
  const form = useForm();

  const [scale, scaleAction] = useScaler(60);

  const { height: screenHeight = window.innerHeight } = useSize(document.body);

  const [fileList, setFileList] = useState([
    /*
    {
      uid: '0',
      name: '水印示例.png',
      status: 'done',
      url: initialImage,
      preview: initialImage,
      originFileObj: initialImage,
      thumbUrl: initialImage,
    },
    */
  ]);

  const [selected, setSeleted] = useState('0');

  const { fileName, previewImage } = useMemo(() => {
    const selectedFile = fileList.find((value) => value.uid === selected);
    return {
      fileName: selectedFile ? selectedFile.name : '未命名',
      previewImage: selectedFile ? selectedFile.preview : initialImage,
    };
  }, [fileList, selected]);

  const onRemove = (file: any) => {
    const currentFileList = fileList.filter((v: any) => v.uid !== file.uid);
    if (currentFileList.length === 0) {
      setSeleted('-1');
      setFileList([]);
      return false;
    }
    const lastFile = currentFileList[currentFileList.length - 1];
    setSeleted(lastFile.uid);
    setFileList(currentFileList);
    return true;
  };

  const onPreview = (file: any) => setSeleted(file.uid);

  const onChange = async ({ file, fileList: currentFileList }) => {
    switch (file.status) {
      case 'uploading': {
        setFileList(
          currentFileList.map((v: any) => {
            return v.uid === file.uid ? file : v;
          }),
        );
        break;
      }
      case 'done': {
        setFileList(
          currentFileList.map((v: any) => {
            return v.uid === file.uid ? file : v;
          }),
        );
        file.preview = await getBase64(file.originFileObj);
        setSeleted(file.uid);
        break;
      }
    }
  };

  const onExport = async () => {
    if (fileList.length === 0) {
      message.error('请打开一张或者以上图片后再下载');
      return;
    }

    const canvasDOM = document.querySelector('canvas');
    if (canvasDOM) {
      canvasDOM.toBlob((blob) => saveAs(blob, fileName));
      await onConfetti();
    }
  };

  const onConfetti = async () => {
    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };
    const sleep = () =>
      new Promise((resolve, reject) => {
        window.setTimeout(() => resolve(''), 100);
      });
    for (let index = 0; index < 5; index++) {
      await sleep();
      confetti({
        angle: randomInRange(55, 125),
        spread: randomInRange(30, 90),
        particleCount: randomInRange(50, 100),
        origin: { y: 0.6 },
      });
    }
  };

  const onExportAll = async () => {
    if (fileList.length === 0) {
      message.error('请打开一张或者以上图片后再下载');
      return;
    }

    const zip = new JSZip();
    const renderCanvas = (ms: number = 1000) => {
      return new Promise<Blob>((resolve, reject) => {
        window.setTimeout(() => {
          const canvasDOM = document.querySelector('canvas');
          if (canvasDOM) {
            canvasDOM.toBlob((blob) => resolve(blob));
          } else {
            reject('error: render');
          }
        }, ms);
      });
    };
    for (let index = 0; index < fileList.length; index++) {
      const file = fileList[index];
      const { name, uid } = file;
      setSeleted(uid);
      const imgBlob = await renderCanvas();
      zip.file(name, imgBlob);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `gsc_watermark_${new Date().getTime()}.zip`);
    await onConfetti();
  };

  return (
    <div className="w-full">
      {/* Header */}
      <header className="fixed z-40 top-4 left-4 flex justify-start items-center content-center">
        <div className="pr-4 text-gray-800">
          <div className="text-2xl font-semibold font-sans z-50">
            葡萄水印工具
          </div>
        </div>
      </header>

      {/* Canvas */}
      <section
        className="pattern-checks-sm | w-full relative bg-gray-200 text-gray-300 flex flex-col justify-center items-center overflow-hidden"
        style={{ height: screenHeight - 128 }}
        onWheel={scaleAction.onWheel}
      >
        <div style={{ transform: `scale(${scale / 100})` }}>
          <div className="text-gray-800 text-xl">
            <span className="inline-block p-2">{fileName}</span>
          </div>
          <Watermark url={previewImage} options={options} />
        </div>
        <Control title="葡萄水印工具" defaultPosition={{ x: -16, y: 16 }}>
          <FormRender
            form={form}
            schema={schema}
            watch={{
              '#': (v) =>
                dispatch({
                  type: 'SET_OPTIONS',
                  payload: {
                    ...initalOptions,
                    ...v,
                  },
                }),
            }}
          />
          <Button
            block
            type="primary"
            className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400"
            onClick={onExport}
          >
            下载
          </Button>
          <div className="py-1"></div>
          <Button block type="ghost" onClick={onExportAll}>
            全部下载
          </Button>
        </Control>
        <Scaler scale={scale} {...scaleAction} />
        <HotKey />
      </section>

      {/* Upload Block */}
      <section className="w-full h-34 p-4 overflow-auto bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 shadow">
        {/* <ImgCrop modalTitle="Image Crop" rotate grid> */}
        <Upload
          method="get"
          listType="picture-card"
          fileList={fileList}
          onRemove={onRemove}
          onPreview={onPreview}
          onChange={onChange}
          multiple={true}
        >
          {fileList.length >= 128 ? null : (
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          )}
        </Upload>
        {/* </ImgCrop> */}
      </section>
    </div>
  );
}
