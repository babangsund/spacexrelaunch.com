const { add } = require("date-fns");
const fs = require("fs");

const liftoffTime = new Date("2022-01-13T10:25:00-0500");

const stage1Positions = [
  [28.60826064452367, 279.3958360268066 - 360], // 0
  [28.58647996582991, 279.4066610487534 - 360], // 15
  [28.56161226495514, 279.4198850996153 - 360], // 30
  [28.53450457887324, 279.4340800190873 - 360], // 45
  [28.49325856296867, 279.4559024522357 - 360], // 1
  [28.42725171739518, 279.4896675603176 - 360], // 1:15
  [28.36620171158581, 279.5220990122377 - 360], // 1:30
  [28.30131647701092, 279.5601324353552 - 360], // 1:45
  [28.23876022416327, 279.5917660222561 - 360], // 2
  [28.16380240769896, 279.6293167588215 - 360], // 2:15
  [28.06085262285809, 279.6836470385683 - 360], // 2:30 // TURN // 24 points from here
  //[28.0608465334377,-80.3163509332775],
  [28.06288632819062, -80.31744953697959],
  [28.06698215737336, -80.31965984061277],
  [28.07507708756421, -80.32415523161423],
  [28.08461537900754, -80.32919944411557],
  [28.09625896152852, -80.33560804820586],
  [28.11228234189526, -80.34412640548335],
  [28.13969114100107, -80.35936313366449],
  [28.16810153410894, -80.37462577562188],
  [28.20443882013713, -80.39372898117431],
  [28.2468644375186, -80.41611983159814],
  [28.28106092432358, -80.43344184196501],
  [28.31728897196636, -80.45273715293426],
  [28.34891340059493, -80.46934388336729],
  [28.3776312690076, -80.48505162357239],
  [28.40157883373046, -80.49797438033841],
  [28.4256561210652, -80.51097381243149],
  [28.44880485965809, -80.52370042446725],
  [28.46308226999169, -80.53097104004192],
  [28.47391107710535, -80.53637751222929],
  [28.47941977902754, -80.53956823395453],
  [28.48384106844113, -80.5419466583765],
  [28.48523674848972, -80.54267616055098],
  [28.48547788675534, -80.54279543071809],
  [28.48574319685369, -80.54291720687887],
];

// stage 1 target = 28.4858458,-80.5434021
// https://www.google.com/maps/place/SpaceX+Landing+Zones+1+%26+2/@28.4858458,-80.5434021,123m/data=!3m1!1e3!4m12!1m6!3m5!1s0x80ec3bf6877558df:0xb0d74df9bc2530d1!2sSpace+Launch+Complex+10!8m2!3d34.7643062!4d-120.6229698!3m4!1s0x88e0a4802dc1919f:0x98f792466f190cfd!8m2!3d28.4857281!4d-80.5429436

const stage2Positions = [
  //[28.16380240769896, 279.6293167588215 - 360],
  [28.06085262285809, 279.6836470385683 - 360],
  [27.92231005672446, 279.7544941318213 - 360],
  [27.76311972491342, 279.8348684973144 - 360],
  [27.60784598391654, 279.915614105024 - 360],
  [27.43589103943514, 280.0002777513384 - 360],
  [27.19038507338662, 280.1260063191728 - 360],
  [26.96275819716524, 280.2203210540014 - 360],
  [26.74139252272776, 280.272046502155 - 360],
  [26.5022259598145, 280.2897593413704 - 360],
  [26.2483068639242, 280.2725244451812 - 360],
  [25.82339738381503, 280.2276398117918 - 360],
  [25.35936737926576, 280.1671217761721 - 360],
  [24.82693902040316, 280.0747743321352 - 360],
  [24.34225841776582, 279.982984636837 - 360],
  [23.81533370780545, 279.9016704440292 - 360],
  [23.29839789429723, 279.7994455298809 - 360],
  [22.67873701804855, 279.6942691875561 - 360],
  [22.0470776417756, 279.5736677316446 - 360],
  [21.48369189427673, 279.4825038391282 - 360],
  [20.9303937775147, 279.3800849656155 - 360],
  [20.3698950089819, 279.2912134733375 - 360],
  [19.7401211633799, 279.180748360318 - 360],
  [19.21105399758123, 279.0827833069173 - 360],
  [18.64195415392233, 278.9795607330112 - 360],
  [18.02921545298432, 278.8545011017987 - 360],
  [16.81576039985571, 278.6334973429148 - 360],
  [15.10316620829034, 278.2768117455972 - 360],
  [7.286053827716596, 276.8370104322444 - 360],
  [-16.9180741302081, 272.5064805593398 - 360],
  [-45.65729596921991, 265.3133009611224 - 360],
  [-79.59606132057478, 152.8371562627438],
  [-51.68898381083009, 101.406440300012],
  [-17.42069245916174, 89.87209318924852],
  [-15.18347498073201, 89.29951918232004],
  [-12.25695739677067, 88.67432859118347],
  [-9.246876426503068, 87.97735302205638],
  [-6.055805292314648, 87.20148705969591],
  [3.238463267422573, 85.10968094122839],
  [31.80821505257242, 78.42476408570317],
  [40.6911905913683, 75.78706943457021],
  [64.68678203040105, 63.68758509098636],
  [66.11691028983797, 62.38313124115218],
  [76.64931352109528, 44.42836308215245],
  [82.01192510880034, 329.0987304434278],
  [76.87138739023101, 290.5590148692886],
  [67.85275647113512, 273.6009211470915],
  [52.24670994608319, 262.21544464589],
  [28.32186479064714, 254.6921154045043],
  [-26.62533868285317, 244.1165474153978],
  [-80.73891514812451, 159.5281595060916],
  [-37.26959971758438, 70.62237592453191],
  [-12.5061852096494, 64.97176454485881],
];

const mission = {
  liftoffTime,
  telemetry: {
    stage: {
      1: [
        // 35 waypoints
        { time: new Date(liftoffTime), altitude: 0.0, speed: 0 },
        { time: add(liftoffTime, { seconds: 15 }), altitude: 0.2, speed: 179 },
        { time: add(liftoffTime, { seconds: 30 }), altitude: 1.6, speed: 471 },
        { time: add(liftoffTime, { seconds: 45 }), altitude: 4.3, speed: 829 },
        { time: add(liftoffTime, { minutes: 1 }), altitude: 8.2, speed: 1131 },
        {
          time: add(liftoffTime, { minutes: 1, seconds: 15 }),
          altitude: 13.6,
          speed: 1652,
        },
        {
          time: add(liftoffTime, { minutes: 1, seconds: 30 }),
          altitude: 20.7,
          speed: 2312,
        },
        {
          time: add(liftoffTime, { minutes: 1, seconds: 45 }),
          altitude: 30.1,
          speed: 3160,
        },
        {
          time: add(liftoffTime, { minutes: 2, seconds: 0 }),
          altitude: 42.6,
          speed: 4252,
        },
        {
          time: add(liftoffTime, { minutes: 2, seconds: 15 }),
          altitude: 58.6,
          speed: 5637,
        },
        {
          time: add(liftoffTime, { minutes: 2, seconds: 30 }),
          altitude: 75.2,
          speed: 5692,
        }, // Turns here
        {
          time: add(liftoffTime, { minutes: 2, seconds: 45 }),
          altitude: 90.5,
          speed: 5011,
        },
        {
          time: add(liftoffTime, { minutes: 3, seconds: 0 }),
          altitude: 104,
          speed: 3588,
        },
        {
          time: add(liftoffTime, { minutes: 3, seconds: 15 }),
          altitude: 115,
          speed: 2500,
        },
        {
          time: add(liftoffTime, { minutes: 3, seconds: 30 }),
          altitude: 125,
          speed: 2267,
        },
        {
          time: add(liftoffTime, { minutes: 3, seconds: 45 }),
          altitude: 132,
          speed: 1837,
        },
        {
          time: add(liftoffTime, { minutes: 4, seconds: 0 }),
          altitude: 137,
          speed: 1454,
        },
        {
          time: add(liftoffTime, { minutes: 4, seconds: 15 }),
          altitude: 140,
          speed: 1188,
        },
        {
          time: add(liftoffTime, { minutes: 4, seconds: 30 }),
          altitude: 141,
          speed: 1096,
        },
        {
          time: add(liftoffTime, { minutes: 4, seconds: 45 }),
          altitude: 139,
          speed: 1226,
        },
        {
          time: add(liftoffTime, { minutes: 5, seconds: 0 }),
          altitude: 136,
          speed: 1525,
        },
        {
          time: add(liftoffTime, { minutes: 5, seconds: 15 }),
          altitude: 131,
          speed: 1913,
        },
        {
          time: add(liftoffTime, { minutes: 5, seconds: 30 }),
          altitude: 123,
          speed: 2347,
        },
        {
          time: add(liftoffTime, { minutes: 5, seconds: 45 }),
          altitude: 113,
          speed: 2807,
        },
        {
          time: add(liftoffTime, { minutes: 6, seconds: 0 }),
          altitude: 102,
          speed: 3280,
        },
        {
          time: add(liftoffTime, { minutes: 6, seconds: 15 }),
          altitude: 88.1,
          speed: 3768,
        },
        {
          time: add(liftoffTime, { minutes: 6, seconds: 30 }),
          altitude: 71.9,
          speed: 4266,
        },
        {
          time: add(liftoffTime, { minutes: 6, seconds: 45 }),
          altitude: 53.8,
          speed: 4724,
        },
        {
          time: add(liftoffTime, { minutes: 7, seconds: 0 }),
          altitude: 36.9,
          speed: 3279,
        },
        {
          time: add(liftoffTime, { minutes: 7, seconds: 15 }),
          altitude: 25.7,
          speed: 2718,
        },
        {
          time: add(liftoffTime, { minutes: 7, seconds: 30 }),
          altitude: 14.9,
          speed: 2463,
        },
        {
          time: add(liftoffTime, { minutes: 7, seconds: 45 }),
          altitude: 7.1,
          speed: 1420,
        },
        {
          time: add(liftoffTime, { minutes: 8, seconds: 0 }),
          altitude: 2.8,
          speed: 875,
        },
        {
          time: add(liftoffTime, { minutes: 8, seconds: 15 }),
          altitude: 0.4,
          speed: 334,
        },
        {
          time: add(liftoffTime, { minutes: 8, seconds: 30 }),
          altitude: 0.0,
          speed: 0,
        },
      ],
      2: [
        // Ses-1
        // Second engine startup
        {
          time: add(liftoffTime, { minutes: 2, seconds: 30 }),
          altitude: 81.5,
          speed: 5747,
        },
        {
          time: add(liftoffTime, { minutes: 2, seconds: 45 }),
          altitude: 91.2,
          speed: 5799,
        },
        {
          time: add(liftoffTime, { minutes: 3, seconds: 0 }),
          altitude: 106,
          speed: 5886,
        },
        {
          time: add(liftoffTime, { minutes: 3, seconds: 15 }),
          altitude: 120,
          speed: 6009,
        },
        {
          time: add(liftoffTime, { minutes: 3, seconds: 30 }),
          altitude: 133,
          speed: 6169,
        },
        {
          time: add(liftoffTime, { minutes: 3, seconds: 45 }),
          altitude: 145,
          speed: 6393,
        },
        {
          time: add(liftoffTime, { minutes: 4, seconds: 0 }),
          altitude: 157,
          speed: 6730,
        },
        {
          time: add(liftoffTime, { minutes: 4, seconds: 15 }),
          altitude: 165,
          speed: 7090,
        },
        {
          time: add(liftoffTime, { minutes: 4, seconds: 30 }),
          altitude: 174,
          speed: 7543,
        },
        {
          time: add(liftoffTime, { minutes: 4, seconds: 45 }),
          altitude: 182,
          speed: 8064,
        },
        {
          time: add(liftoffTime, { minutes: 5, seconds: 0 }),
          altitude: 188,
          speed: 8628,
        },
        {
          time: add(liftoffTime, { minutes: 5, seconds: 15 }),
          altitude: 194,
          speed: 9300,
        },
        {
          time: add(liftoffTime, { minutes: 5, seconds: 30 }),
          altitude: 199,
          speed: 10000,
        },
        {
          time: add(liftoffTime, { minutes: 5, seconds: 45 }),
          altitude: 202,
          speed: 10757,
        },
        {
          time: add(liftoffTime, { minutes: 6, seconds: 0 }),
          altitude: 205,
          speed: 11629,
        },
        {
          time: add(liftoffTime, { minutes: 6, seconds: 15 }),
          altitude: 208,
          speed: 12568,
        },
        {
          time: add(liftoffTime, { minutes: 6, seconds: 30 }),
          altitude: 209,
          speed: 13601,
        },
        {
          time: add(liftoffTime, { minutes: 6, seconds: 45 }),
          altitude: 210,
          speed: 14755,
        },
        {
          time: add(liftoffTime, { minutes: 7, seconds: 0 }),
          altitude: 211,
          speed: 16028,
        },
        {
          time: add(liftoffTime, { minutes: 7, seconds: 15 }),
          altitude: 211,
          speed: 17515,
        },
        {
          time: add(liftoffTime, { minutes: 7, seconds: 30 }),
          altitude: 210,
          speed: 19195,
        },
        {
          time: add(liftoffTime, { minutes: 7, seconds: 45 }),
          altitude: 209,
          speed: 21119,
        },
        {
          time: add(liftoffTime, { minutes: 8, seconds: 0 }),
          altitude: 208,
          speed: 23318,
        },
        {
          time: add(liftoffTime, { minutes: 8, seconds: 15 }),
          altitude: 208,
          speed: 25620,
        },
        {
          time: add(liftoffTime, { minutes: 8, seconds: 30 }),
          altitude: 207,
          speed: 28104,
        },
        {
          time: add(liftoffTime, { minutes: 8, seconds: 45 }),
          altitude: 207,
          speed: 28629,
        },
        {
          time: add(liftoffTime, { minutes: 9, seconds: 0 }),
          altitude: 207,
          speed: 28630,
        },
        {
          time: add(liftoffTime, { minutes: 11, seconds: 15 }),
          altitude: 207,
          speed: 28630,
        },
        {
          time: add(liftoffTime, { minutes: 17, seconds: 0 }),
          altitude: 207,
          speed: 28630,
        },
        {
          time: add(liftoffTime, { minutes: 25, seconds: 0 }),
          altitude: 207,
          speed: 28630,
        },
        {
          time: add(liftoffTime, { minutes: 36, seconds: 30 }),
          altitude: 207,
          speed: 28630,
        },
        {
          time: add(liftoffTime, { minutes: 44, seconds: 0 }),
          altitude: 207,
          speed: 28630,
        },
        // Closing on SECO-2
        {
          time: add(liftoffTime, { minutes: 53, seconds: 15 }),
          altitude: 538,
          speed: 28630,
        },
        {
          time: add(liftoffTime, { minutes: 53, seconds: 30 }),
          altitude: 538,
          speed: 27291,
        },
        {
          time: add(liftoffTime, { minutes: 54, seconds: 15 }),
          altitude: 537,
          speed: 27292,
        },
        {
          time: add(liftoffTime, { minutes: 55, seconds: 0 }),
          altitude: 537,
          speed: 27295,
        },
        {
          time: add(liftoffTime, { minutes: 55, seconds: 45 }),
          altitude: 536,
          speed: 27627,
        },
        {
          time: add(liftoffTime, { minutes: 59, seconds: 0 }),
          altitude: 535,
          speed: 27629,
        },
        {
          time: add(liftoffTime, { hours: 1, minutes: 7, seconds: 0 }),
          altitude: 538,
          speed: 27614,
        },
        {
          time: add(liftoffTime, { hours: 1, minutes: 9, seconds: 0 }),
          altitude: 540,
          speed: 27607,
        },
        {
          time: add(liftoffTime, { hours: 1, minutes: 15, seconds: 45 }),
          altitude: 540,
          speed: 27607,
        },
        {
          time: add(liftoffTime, { hours: 1, minutes: 16, seconds: 0 }),
          altitude: 546,
          speed: 27575,
        },
        {
          time: add(liftoffTime, { hours: 1, minutes: 20, seconds: 0 }),
          altitude: 548,
          speed: 27566,
        },
        {
          time: add(liftoffTime, { hours: 1, minutes: 24, seconds: 0 }),
          altitude: 547,
          speed: 27568,
        },
        {
          time: add(liftoffTime, { hours: 1, minutes: 26, seconds: 0 }),
          altitude: 546,
          speed: 27570,
        },
        {
          time: add(liftoffTime, { hours: 1, minutes: 28, seconds: 30 }),
          altitude: 544,
          speed: 27583,
        },
        {
          time: add(liftoffTime, { hours: 1, minutes: 32, seconds: 0 }),
          altitude: 544,
          speed: 27583,
        },
        {
          time: add(liftoffTime, { hours: 1, minutes: 36, seconds: 0 }),
          altitude: 544,
          speed: 27584,
        },
        {
          time: add(liftoffTime, { hours: 1, minutes: 45, seconds: 0 }),
          altitude: 544,
          speed: 27570,
        },
        {
          time: add(liftoffTime, { hours: 2, minutes: 0, seconds: 0 }),
          altitude: 544,
          speed: 27570,
        },
        {
          time: add(liftoffTime, { hours: 2, minutes: 12, seconds: 0 }),
          altitude: 350,
          speed: 20000,
        },
        {
          time: add(liftoffTime, { hours: 2, minutes: 20, seconds: 0 }),
          altitude: 0,
          speed: 0,
        },
      ],
    },
  },
  events: [
    {
      title: "LIFTOFF",
      time: new Date(liftoffTime),
    },
    {
      title: "MAX-Q",
      time: add(liftoffTime, { minutes: 1, seconds: 15 }),
    },
    {
      title: "MECO",
      time: add(liftoffTime, { minutes: 2, seconds: 19 }),
    },
    {
      title: "BOOSTBACK",
      time: add(liftoffTime, { minutes: 2, seconds: 36 }),
    },
    {
      title: "FAIRING",
      time: add(liftoffTime, { minutes: 3, seconds: 56 }),
    },
    {
      title: "ENTRY",
      time: add(liftoffTime, { minutes: 6, seconds: 43 }),
    },
    {
      title: "LANDING",
      time: add(liftoffTime, { minutes: 8, seconds: 1 }),
    },
    {
      title: "SECO-1",
      time: add(liftoffTime, { minutes: 8, seconds: 33 }),
      checkpoint: true,
    },
    {
      title: "SES-2",
      time: add(liftoffTime, { minutes: 55, seconds: 21 }),
      hiddenUntilApproach: true,
    },
    {
      title: "SECO-2",
      time: add(liftoffTime, { minutes: 55, seconds: 24 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { minutes: 59, seconds: 43 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { minutes: 59, seconds: 56 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, seconds: 30 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 2, seconds: 15 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 2, seconds: 54 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 3 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 3, seconds: 9 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 3, seconds: 21 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 3, seconds: 33 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 3, seconds: 52 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 4, seconds: 20 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 5, seconds: 41 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 5, seconds: 54 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 6, seconds: 6 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 6, seconds: 32 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 6, seconds: 37 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 6, seconds: 56 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 7, seconds: 18 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 7, seconds: 24 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 7, seconds: 36 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 8, seconds: 14 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 8, seconds: 40 }),
    },
    //
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 10, seconds: 33 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 11, seconds: 6 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 11, seconds: 18 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 11, seconds: 30 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 11, seconds: 44 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 12, seconds: 8 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 12, seconds: 33 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 12, seconds: 49 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 13, seconds: 3 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 13, seconds: 32 }),
    },
    //

    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 21, seconds: 12 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 21, seconds: 35 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 22, seconds: 13 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 22, seconds: 25 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 23, seconds: 7 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 23, seconds: 36 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 24, seconds: 35 }),
    },
    {
      title: "DEPLOY",
      time: add(liftoffTime, { hours: 1, minutes: 27, seconds: 10 }),
    },
    // Coverage ends
  ],
};

mission.telemetry.stage[1].forEach((telemetry, index) => {
  telemetry.position = stage1Positions[index];
});

mission.telemetry.stage[2].forEach((telemetry, index) => {
  telemetry.position = stage2Positions[index];
});

fs.writeFile(
  "./transporter-3.json",
  JSON.stringify(mission, null, 2),
  (err) => {
    if (err) {
      console.error(err);
      return;
    }
    //file written successfully
  }
);
