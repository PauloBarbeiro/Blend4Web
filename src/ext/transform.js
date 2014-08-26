"use strict";

/**
 * Object transformations API.
 * With some exceptions specified below, make sure that the objects are not
 * batched.
 * @module transform
 */
b4w.module["transform"] = function(exports, require) {

var m_print   = require("__print");
var physics   = require("__physics");
var transform = require("__transform");
var util      = require("__util");

var _vec3_tmp = new Float32Array(3);
var _quat4_tmp = new Float32Array(4);

/**
 * Transform in the local space
 * @const module:transform.SPACE_LOCAL
 */
exports.SPACE_LOCAL = transform.SPACE_LOCAL;
/**
 * Transform in the world space
 * @const module:transform.SPACE_WORLD
 */
exports.SPACE_WORLD = transform.SPACE_WORLD;

/**
 * Set the object translation.
 * @method module:transform.set_translation
 * @param {Object} obj Object ID
 * @param {Number} x X coord
 * @param {Number} y Y coord
 * @param {Number} z Z coord
 */
exports.set_translation = function(obj, x, y, z) {
    _vec3_tmp[0] = x;
    _vec3_tmp[1] = y;
    _vec3_tmp[2] = z;

    transform.set_translation(obj, _vec3_tmp);
    transform.update_transform(obj);
    physics.sync_transform(obj);
}
/**
 * Set the object translation (vector form).
 * @method module:transform.set_translation_v
 * @param {Object} obj Object ID
 * @param {Float32Array} trans Translation vector
 */
exports.set_translation_v = function(obj, trans) {
    transform.set_translation(obj, trans);
    transform.update_transform(obj);
    physics.sync_transform(obj);
}

/**
 * Set the object translation relative to another object.
 * @method module:transform.set_translation_rel
 * @param {Object} obj Object ID
 * @param {Number} x X coord
 * @param {Number} y Y coord
 * @param {Number} z Z coord
 * @param {Object} obj_parent Parent object ID
 */
exports.set_translation_rel = function(obj, x, y, z, obj_parent) {
    _vec3_tmp[0] = x;
    _vec3_tmp[1] = y;
    _vec3_tmp[2] = z;

    var trans = obj_parent._render.trans;
    var quat = obj_parent._render.quat;

    util.transform_vec3(_vec3_tmp, 1, quat, trans, _vec3_tmp);

    transform.set_translation(obj, _vec3_tmp);
    transform.update_transform(obj);
    physics.sync_transform(obj);
}

/**
 * Get vector with object translation.
 * @method module:transform.get_translation
 * @param {Object} obj Object ID
 * @param {Float32Array} [dest] Destination vector
 * @returns {Float32Array} Destination vector
 */
exports.get_translation = function(obj, dest) {
    if (!dest)
        var dest = new Float32Array(3);

    transform.get_translation(obj, dest);
    return dest;
}

/**
 * Set object rotation
 * @method module:transform.set_rotation
 * @param {Object} obj Object ID
 * @param {Number} x X part of quaternion
 * @param {Number} y Y part of quaternion
 * @param {Number} z Z part of quaternion
 * @param {Number} w W part of quaternion
 */
exports.set_rotation = function(obj, x, y, z, w) {
    _quat4_tmp[0] = x;
    _quat4_tmp[1] = y;
    _quat4_tmp[2] = z;
    _quat4_tmp[3] = w;

    transform.set_rotation(obj, _quat4_tmp);
    transform.update_transform(obj);
    physics.sync_transform(obj);
}
/**
 * @method module:transform.set_rotation_quat
 * @deprecated Use set_rotation() method
 */
exports.set_rotation_quat = exports.set_rotation;

/**
 * Set object rotation (vector form)
 * @method module:transform.set_rotation_v
 * @param {Object} obj Object ID
 * @param {Float32Array} quat Quaternion vector
 */
exports.set_rotation_v = function(obj, quat) {
    transform.set_rotation(obj, quat);
    transform.update_transform(obj);
    physics.sync_transform(obj);
}
/**
 * @method module:transform.set_rotation_quat_v
 * @deprecated Use set_rotation_v() method
 */
exports.set_rotation_quat_v = exports.set_rotation_v;

/**
 * Get object rotation quaternion.
 * @method module:transform.get_rotation
 * @param {Object} obj Object ID
 * @param {Float32Array} [opt_dest] Destination vector
 * @returns {Float32Array} Destination vector
 */
exports.get_rotation = function(obj, opt_dest) {
    if (!opt_dest)
        var opt_dest = new Float32Array(4);

    transform.get_rotation(obj, opt_dest);
    return opt_dest;
}
/**
 * @method module:transform.get_rotation_quat
 * @deprecated Use get_rotation() method
 */
exports.get_rotation_quat = exports.get_rotation;

/**
 * Set euler rotation in the YZX intrinsic system.
 * Using euler angles is discouraged, use quaternion instead.
 * @method module:transform.set_rotation_euler
 * @param {Object} obj Object ID
 * @param {Number} x Angle X
 * @param {Number} y Angle Y
 * @param {Number} z Angle Z
 */
exports.set_rotation_euler = function(obj, x, y, z) {
    _vec3_tmp[0] = x;
    _vec3_tmp[1] = y;
    _vec3_tmp[2] = z;

    transform.set_rotation_euler(obj, _vec3_tmp);
    transform.update_transform(obj);
    physics.sync_transform(obj);
}
/**
 * Set euler rotation in vector form.
 * Using euler angles is discouraged, use quaternion instead.
 * @method module:transform.set_rotation_euler_v
 * @param {Object} obj Object ID
 * @param {Float32Array} euler Vector with euler angles
 */
exports.set_rotation_euler_v = function(obj, euler) {
    transform.set_rotation_euler(obj, euler);
    transform.update_transform(obj);
    physics.sync_transform(obj);
}

/**
 * Set the object scale.
 * @method module:transform.set_scale
 * @param {Object} obj Object ID
 * @param {Number} scale Object scale
 */
exports.set_scale = function(obj, scale) {
    transform.set_scale(obj, scale);
    transform.update_transform(obj);
}
/**
 * Get the object scale.
 * @method module:transform.get_scale
 * @param {Object} obj Object ID
 * @returns {Number} scale
 */
exports.get_scale = function(obj) {
    return transform.get_scale(obj);
}

/**
 * Reset EMPTY's transform to allow child objects behave in the absolute (world) space.
 * Works only for EMPTYes with "relative group coords" option enabled.
 * @method module:transform.empty_reset_transform
 * @param {Object} obj Object ID
 */
exports.empty_reset_transform = function(obj) {
    if (obj["type"] != "EMPTY") {
        m_print.error("Wrong object: " + obj["name"]);
        return false;
    }

    transform.set_translation(obj, [0, 0, 0]);
    transform.set_rotation(obj, [0, 0, 0, 1]);
    transform.set_scale(obj, 1);
    transform.update_transform(obj);
    physics.sync_transform(obj);
}

/**
 * Get object size (maximum radius, calculated from bounding box).
 * @method module:transform.get_object_size
 * @param {Object} obj Object ID
 * @returns {Number} Object size
 */
exports.get_object_size = function(obj) {

    if (!util.is_mesh(obj)) {
        m_print.error("Wrong object: " + obj["name"]);
        return 0;
    }

    return transform.get_object_size(obj);
}
/**
 * Get the object center in the world space.
 * Works for dynamic and static objects.
 * @method module:transform.get_object_center
 * @param {Object} obj Object ID
 * @param {Boolean} calc_bs_center Use the object's bounding sphere to
 * calculate center, otherwise the use bounding box.
 * @param {Float32Array} [dest] Destination vector
 * @returns {Float32Array} Destination vector
 */
exports.get_object_center = function(obj, calc_bs_center, dest) {

    if (!util.is_mesh(obj)) {
        m_print.error("Wrong object: " + obj["name"]);
        return null;
    }

    return transform.get_object_center(obj, calc_bs_center, dest);
}

/**
 * Perform incremental object movement in the local space.
 * @method module:transform.move_local
 * @param {Object} obj Object ID
 * @param {Number} x DeltaX coord
 * @param {Number} y DeltaY coord
 * @param {Number} z DeltaZ coord
 */
exports.move_local = function(obj, dx, dy, dz) {
    transform.move_local(obj, dx, dy, dz);
    transform.update_transform(obj);
    physics.sync_transform(obj);
}

/**
 * Get object bounding box.
 * @method module:transform.get_object_bounding_box
 * @param {Object} obj Object ID
 * @returns {Object} Bounding box
 * @cc_externs max_x min_x max_y min_y max_z min_z
 */
exports.get_object_bounding_box = function(obj) {
    return transform.get_object_bounding_box(obj);
}

}