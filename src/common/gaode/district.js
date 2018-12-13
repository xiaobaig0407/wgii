/**
 * 高德API查询国内行政区域
 */

const fs = require('fs');
const path = require('path');
const { gcj02towgs84 } = require('coordtransform');
const request = require('request-promise');

const { gaode: { api: { map: { key } } } } = require('../../../config');

const baseUrl = 'https://restapi.amap.com/v3/config/district';

const adcodes = [
  110000, 120000, 130000, 140000, 150000,
  210000, 220000, 230000,
  310000, 320000, 330000, 340000, 350000, 360000, 370000,
  410000, 420000, 430000, 440000, 450000, 460000,
  500000, 510000, 520000, 530000, 540000,
  610000, 620000, 630000, 640000, 650000,
  710000,
  810000, 820000,
];

async function getProvince(adcode) {
  const result = await request(`${baseUrl}?key=${key}&keywords=${adcode}&subdistrict=0&extensions=all`, { json: true });
  return result;
}

async function china() {
  const result = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'MultiPolygon' },
      properties: { name: 'China', code: 'CHN' },
    }],
  };
  const { districts: [{ polyline }] } = await getProvince(100000);
  const gcj02Coordinates = [];
  const wgs84Coordinates = [];
  const pointsArray = polyline.split('|'); // 切分点组
  if (pointsArray.length === 0) { return; }
  pointsArray.forEach((pointsStr) => {
    const points = pointsStr.split(';'); // 切分成点
    const gcj02Points = []; // 国测局坐标点集
    const wgs84Points = []; // GPS坐标点集
    points.forEach((pointStr) => {
      const arr = pointStr.split(',');
      if (arr.length > 0) {
        const longitude = arr[0];
        const latitude = arr[1];
        gcj02Points.push([longitude, latitude]);
        wgs84Points.push(gcj02towgs84(longitude, latitude));
      }
    });
    gcj02Coordinates.push(gcj02Points);
    wgs84Coordinates.push(wgs84Points);
  });
  const { features: [{ geometry, properties }] } = result;
  geometry.coordinates = gcj02Coordinates;
  properties.coordinatesSystem = 'GCJ02';
  await fs.writeFileSync(path.join(__dirname, '../../../dist/CHN/country.gcj02.geo.json'), JSON.stringify(result));
  geometry.coordinates = wgs84Coordinates;
  properties.coordinatesSystem = 'WGS84';
  await fs.writeFileSync(path.join(__dirname, '../../../dist/CHN/country.wgs84.geo.json'), JSON.stringify(result));
}

async function run() {
  await china();
}

run()
  .then(console.info)
  .catch(console.error);
