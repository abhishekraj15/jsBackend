// import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const publishAVideo = asyncHandler(async (req, res) => {
  // TODO: get video, upload to cloudinary, create video

  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All Fields are required");
  }

  const videoFileLocalPath = req.files?.videoFile[0].path;
  const thumbnailLocalPath = req.files?.thumbnail[0].path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "VideoFileLocalPath is required");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "ThumbnailLocalPath is required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(400, "Video file is not found.");
  }
  if (!thumbnail) {
    throw new ApiError(400, "Thumbnail file is not found");
  }

  // const video = await Video.create({
  //   title,
  //   description,
  //   duration: videoFile.duration,
  //   videoFile: videoFile.url,
  //   thumbnail: thumbnail.url,
  //   owner: req.user?._id,
  //   isPublished: false,
  // });

  const video = await Video.create({
    title,
    description,
    duration: videoFile.duration,
    videoFile: {
      url: videoFile.url,
      public_id: videoFile.public_id,
    },
    thumbnail: {
      url: thumbnail.url,
      public_id: thumbnail.public_id,
    },
    owner: req.user?._id,
    isPublished: false,
  });

  const videoUploaded = await Video.findById(video._id);

  if (!videoUploaded) {
    throw new ApiError(500, "Video upload failed please try again !!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Uploaded Successfully"));
});

// const getAllVideos = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
//   //TODO: get all videos based on query, sort, pagination
// });

// const getVideoById = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   //TODO: get video by id
// });

//TODO: update video details like title, description, thumbnail
const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Id not found in params");
  }

  if (!title && !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const videoData = await Video.findById(videoId);
  if (!videoData) {
    throw new ApiError(400, "Video not found.!!");
  }

  if (videoData?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can't edit this video as you are not the owner"
    );
  }

  const thumbnailToDelete = videoData.thumbnail.public_id;

  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail is required");
  }
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    throw new ApiError(400, "thumbnail not found");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: {
          public_id: thumbnail.public_id,
          url: thumbnail.url,
        },
      },
    },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(500, "Failed to update video please try again");
  }

  if (updatedVideo) {
    await deleteOnCloudinary(thumbnailToDelete);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

//TODO: delete video
const deleteVideo = asyncHandler(async (req, res) => {
  //   const variable= req.params.id
  // Is case m variable ka name kuch bhi likh skte h bs req.params k baad name same hona chahiye I'd ka jo route m ho
  // const {id} = req.params

  const { id } = req.params;
  console.log("🚀 ~ deleteVideo ~ videoId:", id);

  if (!id) {
    throw new ApiError(400, "Video id not found in params.!!");
  }

  const video = await Video.findByIdAndDelete(id);
  if (!video) {
    throw new ApiError(400, "Video not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video has been deleted.!!"));
});

// const togglePublishStatus = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
// });

export {
  //getAllVideos,
  publishAVideo,
  //getVideoById,
  updateVideo,
  deleteVideo,
  //togglePublishStatus,
};
