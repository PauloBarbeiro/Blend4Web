"use strict";

/** 
 * Camera API. 
 * All functions require a valid camera object ID.
 * Constraints and standard translation/rotation functions also supported.
 * @module camera
 */
b4w.module["camera"] = function(exports, require) {

var camera      = require("__camera");
var config      = require("__config");
var m_phy       = require("__physics");
var m_print     = require("__print");
var constraints = require("__constraints");
var transform   = require("__transform");
var util        = require("__util");

var m_vec3 = require("vec3");
var m_vec4 = require("vec4");
var m_quat = require("quat");
var m_mat4 = require("mat4");

var cfg_ctl = config.controls;

var _vec3_tmp = new Float32Array(3);
var _vec3_tmp2 = new Float32Array(3);
var _quat4_tmp = new Float32Array(4);
var _vec4_tmp = new Float32Array(4);

/**
 * Camera movement style - static.
 * @const module:camera.MS_STATIC
 */
exports.MS_STATIC = camera.MS_STATIC;
/**
 * Camera movement style - animated.
 * @const module:camera.MS_ANIMATION
 */
exports.MS_ANIMATION = camera.MS_ANIMATION;
/**
 * Camera movement style - controls.
 * @const module:camera.MS_CONTROLS
 * @deprecated Use MS_TARGET_CONROLS or MS_EYE_CONTROLS
 */
exports.MS_CONTROLS = camera.MS_TARGET_CONTROLS;
/**
 * Camera movement style - target.
 * @const module:camera.MS_TARGET_CONTROLS
 */
exports.MS_TARGET_CONTROLS = camera.MS_TARGET_CONTROLS;
/**
 * Camera movement style - eye.
 * @const module:camera.MS_EYE_CONTROLS
 */
exports.MS_EYE_CONTROLS = camera.MS_EYE_CONTROLS;

/**
 * Check if the object is a camera.
 * @method module:camera.is_camera
 * @param {Object} obj Object ID
 */
exports.is_camera = function(obj) {
    return camera.is_camera(obj);
}

/**
 * Set camera movement style (MS_*)
 * @method module:camera.set_move_style
 * @param {Object} camobj Camera Object ID
 * @param {Number} move_style Camera movement style
 */
exports.set_move_style = function(camobj, move_style) {
    camobj._render.move_style = move_style;
}
/**
 * Get camera movement style
 * @method module:camera.get_move_style
 * @param {Object} camobj Camera Object ID
 * @returns {Number} Camera movement style
 */
exports.get_move_style = function(camobj) {
    if (!camera.is_camera(camobj)) {
        m_print.error("Wrong object");
        return null;
    }

    return camera.get_move_style(camobj);
}
/**
 * @method module:camera.change_eye_target_dist
 * @deprecated eye-target distance is a constant now
 */
exports.change_eye_target_dist = function() {
    m_print.error("change_eye_target_dist() deprecated");
}
/**
 * Multiply camera translation speed by a factor
 * @method module:camera.change_trans_speed
 * @param {Object} camobj Camera Object ID
 * @param {Number} factor Speed factor
 */
exports.change_trans_speed = function(camobj, factor) {

    var render = camobj._render;

    var trans_speed = render.trans_speed[0];
    trans_speed *= (1 + factor * cfg_ctl.cam_zoom_base_speed);
    render.trans_speed = [trans_speed, trans_speed, trans_speed];
}

// TODO: this is just a storage for speed, check or remove it
exports.get_trans_speed = function(camobj) {
    if (!camera.is_camera(camobj)) {
        m_print.error("Wrong object");
        return 0;
    }

    return camobj._render.trans_speed[0];
}

/**
 * Low-level function: set camera position based on input parameters
 * @method module:camera.set_look_at
 * @param {Object} camobj Camera Object ID
 * @param {Float32Array} eye Eye vector
 * @param {Float32Array} target Target vector
 * @param {Float32Array} up Up vector
 * @param {Number} elapsed The time which is elapsed from the previous execution
 */
exports.set_look_at = function(camobj, eye, target, up, elapsed) {
    var render = camobj._render;

    camera.eye_target_up_to_trans_quat(eye, target, up, render.trans, render.quat);

    transform.update_transform(camobj);
    m_phy.sync_transform(camobj);
};

/**
 * Get camera eye vector.
 * @method module:camera.get_eye
 * @param {Object} camobj Camera Object ID
 * @returns {Float32Array} Eye
 */
exports.get_eye = function(camobj) {
    return camobj._render.trans;
}

exports.set_pivot = set_pivot;
/**
 * Set pivot point for TARGET camera.
 * @method module:camera.set_pivot
 * @param {Object} camobj Camera Object ID
 * @param {Float32Array} coords Pivot vector
 */
function set_pivot(camobj, coords) {

    if (!camera.is_target_camera(camobj)) {
        m_print.error("set_pivot(): Wrong object or camera move style");
        return;
    }

    m_vec3.copy(coords, camobj._render.pivot);
}

/**
 * Get the camera pivot point.
 * @method module:camera.get_pivot
 * @param {Object} camobj Camera Object ID
 * @param {Float32Array} [dest] Destination pivot vector
 * @returns {Float32Array} Destination pivot vector
 */
exports.get_pivot = function(camobj, dest) {

    if (!camera.is_target_camera(camobj)) {
        m_print.error("get_pivot(): Wrong object or camera move style");
        return;
    }

    if (!dest)
        var dest = new Float32Array(3);

    var render = camobj._render;

    m_vec3.copy(render.pivot, dest);
    return dest;
}

/**
 * Rotate TARGET camera around the pivot point.
 * +h from left to right (CCW around Y)
 * +v down (CCW around DIR x Y)
 * @method module:camera.rotate_pivot
 * @param {Object} camobj Camera Object ID
 * @param {Number} angle_h_delta Horizontal angle in radians
 * @param {Number} angle_v_delta Vertical angle in radians
 */
exports.rotate_pivot = function(camobj, angle_h_delta, angle_v_delta) {

    if (!camera.is_target_camera(camobj)) {
        m_print.error("rotate_pivot(): wrong object");
        return;
    }

    var render = camobj._render;

    var axis = _vec3_tmp;
    var rot = _quat4_tmp;

    // angle_h_delta around world Y
    axis[0] = 0;
    axis[1] = 1;
    axis[2] = 0;

    m_quat.setAxisAngle(axis, angle_h_delta, rot);
    util.rotate_point_pivot(render.trans, render.pivot, rot, render.trans);

    // angle_v_delta around local X transformed to world space
    axis[0] = 1;
    axis[1] = 0;
    axis[2] = 0;

    m_vec3.transformQuat(axis, render.quat, axis);
    m_quat.setAxisAngle(axis, angle_v_delta, rot);
    util.rotate_point_pivot(render.trans, render.pivot, rot, render.trans);

    transform.update_transform(camobj);
    m_phy.sync_transform(camobj);
}

/**
 * Set vertical clamping limits for TARGET or EYE camera.
 * @method module:camera.apply_vertical_limits
 * @param {Object} camobj Camera Object ID
 * @param {Number} down_angle Vertical down limit angle
 * @param {Number} up_angle Vertical up limit angle
 * @param {Number} space Space to make clamping relative to
 */
exports.apply_vertical_limits = function(camobj, down_angle, up_angle, space) {
    var render = camobj._render;
    render.vertical_limits = {
        down: down_angle,
        up: up_angle
    };

    
    // transform to world space if needed
    if (space == transform.SPACE_LOCAL)
        camera.vertical_limits_local_to_world(camobj);
    // correct according to horizontal limits
    camera.vertical_limits_correct(camobj);
}

/**
 * Remove vertical clamping limits from TARGET or EYE camera.
 * @method module:camera.clear_vertical_limits
 * @param {Object} camobj Camera Object ID
 */
exports.clear_vertical_limits = function(camobj) {
    var render = camobj._render;
    render.vertical_limits = null;

    // NOTE: set to [-PI, PI] if horizontal limits are switched on
    camera.vertical_limits_correct(camobj);
}

/**
 * Set horizontal clamping limits for TARGET or EYE camera.
 * @method module:camera.apply_horizontal_limits
 * @param {Object} camobj Camera Object ID
 * @param {Number} left_angle Horizontal left limit angle
 * @param {Number} right_angle Horizontal right limit angle
 * @param {Number} space Space to make clamping relative to
 */
exports.apply_horizontal_limits = function(camobj, left_angle, right_angle,
        space) {
    var render = camobj._render;
    render.horizontal_limits = {
        left: left_angle,
        right: right_angle
    };

    // transform to world space if needed
    if (space == transform.SPACE_LOCAL)
        camera.horizontal_limits_local_to_world(camobj);
    // correct according to horizontal limits
    camera.vertical_limits_correct(camobj);
}

/**
 * Remove horizontal clamping limits from TARGET or EYE camera.
 * @method module:camera.clear_horizontal_limits
 * @param {Object} camobj Camera Object ID
 */
exports.clear_horizontal_limits = function(camobj) {
    var render = camobj._render;
    render.horizontal_limits = null;
}

/**
 * Set distance limits for TARGET camera.
 * @method module:camera.apply_distance_limits
 * @param {Object} camobj Camera Object ID
 * @param {Number} min Minimum distance to target
 * @param {Number} max Maximum distance to target
 */
exports.apply_distance_limits = function(camobj, min, max) {
    if (!camera.is_target_camera(camobj)) {
        m_print.error("apply_distance_limits(): wrong object");
        return;
    }

    if (min > max) {
        m_print.error("apply_distance_limits(): wrong distance limits");
        return;
    }

    var render = camobj._render;
    render.use_distance_limits = true;
    render.distance_min = min;
    render.distance_max = max;
}

/**
 * Remove distance clamping limits for TARGET camera
 * @method module:camera.clear_distance_limits
 * @param {Object} camobj Camera Object ID
 */
exports.clear_distance_limits = function(camobj) {
    if (!camera.is_target_camera(camobj)) {
        m_print.error("clear_distance_limits(): wrong object");
        return;
    }

    camobj._render.use_distance_limits = false;
}

/**
 * Set eye params needed to set the camera target
 * @method module:camera.set_eye_params
 * @param {Object} camobj Camera Object ID
 * @param {Number} h_angle Horizontal angle
 * @param {Number} v_angle Vertiacal angle
 */
exports.set_eye_params = function(camobj, h_angle, v_angle) {

    var render = camobj._render;

    m_quat.identity(render.quat);

    camera.rotate_v_local(camobj, Math.PI/2);

    camera.rotate_h(camobj, h_angle);
    camera.rotate_v_local(camobj, -v_angle);

    transform.update_transform(camobj);
    m_phy.sync_transform(camobj);
}
/**
 * Check if the camera is looking upwards
 * @method module:camera.is_look_up
 * @param {Object} camobj Camera Object ID
 */
exports.is_look_up = function(camobj) {
    var quat = camobj._render.quat;

    var dir = _vec3_tmp;
    util.quat_to_dir(quat, util.AXIS_MY, dir);

    if (dir[1] >= 0)
        return true;
    else 
        return false;
}
/**
 * Rotate the camera.
 * Around a target for TARGET movement style, around the eye for EYE movement
 * style.
 * @method module:camera.rotate
 * @param {Object} camobj Camera Object ID
 * @param {Number} angle_h_delta Horizontal angle in radians
 * @param {Number} angle_v_delta Vertical angle in radians
 */
exports.rotate = function(camobj, angle_h_delta, angle_v_delta) {

    // NOTE: MS_EYE_CONTROLS only
    camera.rotate_h(camobj, angle_h_delta);
    camera.rotate_v_local(camobj, -angle_v_delta);

    transform.update_transform(camobj);
    m_phy.sync_transform(camobj);
}
/**
 * Get angles.
 * Get the camera horizontal and vertical angles
 * @method module:camera.get_angles
 * @param {Object} camobj Camera Object ID
 * @param {Float32Array} [dest] Destination vector for camera angles: (h, v)
 * @returns {Float32Array} Destination vector for camera angles: (h, v)
 */
exports.get_angles = function(camobj, dest) {
    if (!dest)
        var dest = new Float32Array(2);
    camera.get_angles(camobj, dest);
    return dest;
}
/**
 * Set distance to the convergence plane for a stereo camera.
 * @method module:camera.set_stereo_distance
 * @param {Object} camobj Camera Object ID
 * @param {Number} conv_dist Distance from the convergence plane
 */
exports.set_stereo_distance = function(camobj, conv_dist) {

    var cameras = camobj._render.cameras;
    for (var i = 0; i < cameras.length; i++) {
        var cam = cameras[i];

        if (cam.type == camera.TYPE_STEREO_LEFT || 
                cam.type == camera.TYPE_STEREO_RIGHT)
            camera.set_stereo_params(cam, conv_dist, cam.stereo_eye_dist);
    }
}
/**
 * Get distance from the convergence plane for a stereo camera
 * @method module:camera.get_stereo_distance
 * @param {Object} camobj Camera Object ID
 * @returns {Number} Distance from convergence plane
 */
exports.get_stereo_distance = function(camobj, conv_dist) {

    var cameras = camobj._render.cameras;
    for (var i = 0; i < cameras.length; i++) {
        var cam = cameras[i];

        if (cam.type == camera.TYPE_STEREO_LEFT || 
                cam.type == camera.TYPE_STEREO_RIGHT)
            return cam.stereo_conv_dist;
    }

    return 0;
}
/**
 * Returns true if the camera's eye is located under the water surface
 * @method module:camera.is_underwater
 * @param camobj Camera Object ID
 * @returns {Boolean}
 * @deprecated Always returns false
 */
exports.is_underwater = function(camobj) {
    var render = camobj._render;
    return render.underwater;
}
/**
 * Translate the view plane.
 * @method module:camera.translate_view
 * @param {Object} camobj Camera Object ID
 * @param {Number} x X coord (positive left to right)
 * @param {Number} y Y coord (positive down to up)
 * @param {Number} angle Rotation angle (clockwise)
 */
exports.translate_view = function(camobj, x, y, angle) {

    var cameras = camobj._render.cameras;
    for (var i = 0; i < cameras.length; i++) {
        var cam = cameras[i];

        // NOTE: camera projection matrix already has been updated in 
        // set_view method of camera
        if (!cam.reflection_plane) 
            camera.set_projection(cam, cam.aspect);

        var vec3_tmp = _vec3_tmp;
        vec3_tmp[0] = -x;
        vec3_tmp[1] = -y;
        vec3_tmp[2] = 0;

        m_mat4.translate(cam.proj_matrix, vec3_tmp, cam.proj_matrix);
        m_mat4.rotateZ(cam.proj_matrix, angle, cam.proj_matrix);

        m_mat4.multiply(cam.proj_matrix, cam.view_matrix, cam.view_proj_matrix);
        camera.calc_view_proj_inverse(cam);
        camera.calc_sky_vp_inverse(cam);
    }
}
/**
 * Up correction is required in some cases then camera releases from constrainted  mode.
 * @param {Object} camobj Camera object ID
 * @param {Float32Array} y_axis Axis vector
 */
exports.correct_up = function(camobj, y_axis) {
    if (!y_axis) {
        y_axis = util.AXIS_Y;
    }

    constraints.correct_up(camobj, y_axis);
}

/**
 * Zoom the camera on the object.
 * @method module:camera.zoom_object
 * @param {Object} camobj Camera Object ID
 * @param {Object} obj Object ID
 */
exports.zoom_object = function(camobj, obj) {

    if (!camera.is_target_camera(camobj)) {
        m_print.error("zoom_object(): wrong object");
        return;
    }

    var calc_bs_center = false;

    var center = _vec3_tmp;
    transform.get_object_center(obj, calc_bs_center, center);
    set_pivot(camobj, center);
    transform.update_transform(camobj);

    var radius = transform.get_object_size(obj);
    var ang_radius = camera.get_angular_diameter(camobj) / 2;

    var dist_need = radius / Math.sin(ang_radius);
    var dist_current = transform.obj_point_distance(camobj, center);

    // +y move backward
    transform.move_local(camobj, 0, dist_need - dist_current, 0);

    transform.update_transform(camobj);
    m_phy.sync_transform(camobj);
}

/**
 * Calculate the direction of the camera ray based on screen coords
 * Screen space origin is the top left corner
 * @method module:camera.calc_ray
 * @param {Number} xpix X screen coordinate
 * @param {Number} ypix Y screen coordinate
 * @param {Float32Array} [dest] Destination vector
 * @returns {Float32Array} Destination vector
 */
exports.calc_ray = function(camobj, xpix, ypix, dest) {

    if (!dest)
        var dest = new Float32Array(3);

    var cam = camobj._render.cameras[0];

    switch (cam.type) {
    case camera.TYPE_PERSP:
    case camera.TYPE_PERSP_ASPECT:
    case camera.TYPE_STEREO_LEFT:
    case camera.TYPE_STEREO_RIGHT:
        var top_1m = Math.tan(cam.fov * Math.PI / 360.0);
        var right_1m = top_1m * cam.aspect;

        var dir = _vec4_tmp;

        // in the camera's local space
        dir[0] = (2.0 * xpix / cam.width - 1.0) * right_1m;
        dir[1] = -1;
        dir[2] = (2.0 * ypix / cam.height - 1.0) * top_1m;
        dir[3] = 0;

        var wm = camobj._render.world_matrix;
        m_vec4.transformMat4(dir, wm, dir);

        dest[0] = dir[0];
        dest[1] = dir[1];
        dest[2] = dir[2];

        m_vec3.normalize(dest, dest);

        return dest;
    default:
        m_print.error("Non-compatible camera");
        return dest;
    }
}

/**
 * Project point on the viewport
 * Screen space origin is the top left corner
 * @method module:camera.project_point
 * @param {Float32Array} point Point in world space
 * @param {Float32Array} [dest] Destination vector
 * @returns {Float32Array} Viewport coordinates
 */
exports.project_point = function(camobj, point, dest) {
    if (!dest)
        var dest = new Float32Array(2);

    var cam = camobj._render.cameras[0];

    switch (cam.type) {
    case camera.TYPE_PERSP:
    case camera.TYPE_PERSP_ASPECT:
    case camera.TYPE_STEREO_LEFT:
    case camera.TYPE_STEREO_RIGHT:

        // get direction from camera location to point
        var cam_trans = _vec3_tmp;
        transform.get_translation(camobj, cam_trans);
        m_vec3.subtract(point, cam_trans, cam_trans);

        var dir = _vec4_tmp;
        dir.set(cam_trans);
        dir[3] = 0;

        var vp = cam.view_proj_matrix;
        m_vec4.transformMat4(dir, vp, dir);


        var x = dir[0] / dir[3];
        // NOTE: flip y coordinate to match space origin (top left corner)
        // view+proj transformation doesn't do it
        var y = -dir[1] / dir[3];

        // transform from [-1, 1] to [0, cam.width] or [0, cam.height] interval
        dest[0] = (x + 1) / 2 * cam.width | 0;
        dest[1] = (y + 1) / 2 * cam.height | 0;

        return dest;
    default:
        m_print.error("Non-compatible camera");
        return dest;
    }
}

}