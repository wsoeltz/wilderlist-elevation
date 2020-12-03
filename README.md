# wilderlist-elevation (AltitudeMap.com)

> API for retrieving elevation data at a specified coordinate

Live Example: https://altitudemap.com/?lat=44.2705&lng=-71.3034

### Usage

The API takes the following parameters via a GET request:

- **`lat`**: `number` The specified latitude of the point
- **`lng`**: `number` The specified longitude of the point
- **`units`** *(optional)*: `string` Units of the returned elevation value. Can be either `meters` or `feet`. Defaults to `meters`
- **`format`** *(optional)*: `string` Format of the returned data. Can be either `default` to receive the default JSON object, or `geojson` to receive the result as a [GeoJSON Point](https://tools.ietf.org/html/rfc7946#section-3.1.2). Defaults to `default`

### Running the app

1. To run the app, first pull the repo onto your machine. CD into the root directory and run  `npm i` to install all dependencies.
1. Create a file in the root directory called `.env` and add the following lines if running locally. If running elsewhere, modify or set the environment variables as is necessary. 
    ```
    NODE_ENV=development
    TILE_PATH=./efs/
    ```
1. Run `npm start` to run the app. It should now be visible at `localhost:5000`

### Mounting an EFS for caching tiles

Included in this repo is the file `/.ebextensions/storage-efs-mountfilesystem.config` which tells the Elastic Beanstalk CLI to mount the specified EFS to all EC2 instances that are spun up for the app. In order to have it work with your specific implementation, the `FILE_SYSTEM_ID` will need to be updated to your specific file system ID. Additionally the `MOUNT_DIRECTORY` can be changed if so desired, and either way it will need to be added as the `TILE_PATH` environment variable in the Elastic Beanstalk environment.
