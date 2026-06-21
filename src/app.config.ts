export default defineAppConfig({
  pages: [
    'pages/vehicles/index',
    'pages/records/index',
    'pages/mine/index',
    'pages/vehicle-detail/index',
    'pages/acceptance/index',
    'pages/scan/index',
    'pages/anomaly-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0088CC',
    navigationBarTitleText: '冷链温度追踪',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#0088CC',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/vehicles/index',
        text: '在途车辆'
      },
      {
        pagePath: 'pages/records/index',
        text: '验收记录'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
