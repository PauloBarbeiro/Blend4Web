"use strict";

/**
 * Scene API.
 * Almost every routine requires an active scene to be set,
 * use get_active() set_active() to do that.
 * @module scenes
 */
b4w.module["scenes"] = function(exports, require) {

var m_batch     = require("__batch");
var m_print     = require("__print");
var physics     = require("__physics");
var m_scenes    = require("__scenes");
var util        = require("__util");

/**
 * All possible data IDs.
 * @const module:scenes.DATA_ID_ALL
 */
exports.DATA_ID_ALL   = m_scenes.DATA_ID_ALL;

/* subscene types for different aspects of processing */

// need light update
var LIGHT_SUBSCENE_TYPES = ["MAIN_OPAQUE", "MAIN_BLEND", "MAIN_REFLECT",
        "GOD_RAYS", "SKY"];

/**
 * Set the active scene
 * @method module:scenes.set_active
 * @param {String} scene_name Name of scene
 */
exports.set_active = function(scene_name) {
    // NOTE: keysearch is dangerous
    var scenes = m_scenes.get_all_scenes();
    m_scenes.set_active(util.keysearch("name", scene_name, scenes));
}

/**
 * Get the current active scene
 * @method module:scenes.get_active
 * @returns {String} Active scene name
 */
exports.get_active = function() {
    if (!m_scenes.check_active())
        return "";
    else
        return m_scenes.get_active()["name"];
}
/**
 * Get all scene names.
 * @method module:scenes.get_scenes
 * @returns {Array} Array of scene names
 */
exports.get_scenes = function() {
    var scenes = m_scenes.get_all_scenes();
    var scene_names = [];
    for (var i = 0; i < scenes.length; i++)
        scene_names.push(scenes[i]["name"]);

    return scene_names;
}
/**
 * Get all on-screen scene names (ignore the ones used for texture rendering)
 * @method module:scenes.get_screen_scenes
 * @deprecated No scene switching anymore
 */
exports.get_screen_scenes = function() {
    m_print.log("get_screen_scenes() deprecated");
    return "";
}
/**
 * Return the active camera object from the active scene
 * @method module:scenes.get_active_camera
 * @returns {Object} Camera object ID
 */
exports.get_active_camera = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    } else
        return m_scenes.get_active()["camera"];
}

/**
 * Get object by name.
 * @method module:scenes.get_object_by_name
 * @param {String} name Object name
 * @param {Number} data_id Id of loaded data
 * @returns {Object} Object ID
 */
exports.get_object_by_name = function(name, data_id) {
    return m_scenes.get_object(m_scenes.GET_OBJECT_BY_NAME, name,
            data_id);
}

/**
 * Get object by empty name and dupli name.
 * @method module:scenes.get_object_by_dupli_name
 * @param {String} empty_name EMPTY object name
 * @param {String} dupli_name DUPLI object name
 * @param {Number} data_id Id of loaded data
 * @returns {Object} Object ID
 */
exports.get_object_by_dupli_name = function(empty_name, dupli_name,
        data_id) {
    return m_scenes.get_object(m_scenes.GET_OBJECT_BY_DUPLI_NAME, empty_name,
            dupli_name, data_id);
}

/**
 * Get object by empty name and dupli name list.
 * @method module:scenes.get_object_by_dupli_name_list
 * @param {Array} name_list List of EMPTY and DUPLI object names
 * @param {Number} data_id Id of loaded data
 * @returns {Object} Object ID
 */
exports.get_object_by_dupli_name_list = function(name_list, data_id) {
    return m_scenes.get_object(m_scenes.GET_OBJECT_BY_DUPLI_NAME_LIST,
            name_list, data_id);
}

/**
 * @method module:scenes.get_object_by_empty_name
 * @deprecated use scenes.get_object_by_dupli_name instead
 */
exports.get_object_by_empty_name = function(empty_name, dupli_name,
        data_id) {
    m_print.warn("get_object_by_empty_name() deprecated, use get_object_by_dupli_name() instead");
    return exports.get_object_by_dupli_name(empty_name, dupli_name, data_id);
}

/**
 * Returns object data_id property
 * @method module:scenes.get_object_data_id
 * @param {Object} obj Object ID
 * @returns {Number} [data_id] Data id property
 */
exports.get_object_data_id = function(obj) {
    return m_scenes.get_object_data_id(obj);
}


/**
 * For given mouse coords, render the color scene and return an object
 * @method module:scenes.pick_object
 * @param x X screen coordinate
 * @param y Y screen coordinate
 */
exports.pick_object = m_scenes.pick_object;

/**
 * Set outline glow intensity for the object
 * @method module:scenes.set_glow_intensity
 * @param {Object} obj Object ID
 * @param {Number} value Intensity value
 */
exports.set_glow_intensity = function(obj, value) {
    for (var i = 0; i < obj._batches.length; i++) {
        var batch = obj._batches[i];

        if (batch.type == "COLOR_ID")
            batch.glow_intensity = value;
    }
}

/**
 * Apply glowing animation to the object
 * @method module:scenes.apply_glow_anim
 * @param {Object} obj Object ID
 * @param {Number} tau Glowing duration
 * @param {Number} T Period of glowing
 * @param {Number} N Number of relapses (0 - infinity)
 */
exports.apply_glow_anim = function(obj, tau, T, N) {
    if (obj._render && obj._render.selectable)
        m_scenes.apply_glow_anim(obj, tau, T, N);
}

/**
 * Apply glowing animation to the object and use the object's default settings
 * @method module:scenes.apply_glow_anim_def
 * @param {Object} obj Object ID
 */
exports.apply_glow_anim_def = function(obj) {
    if (obj._render && obj._render.selectable) {
        var ga = obj._render.glow_anim_settings;
        m_scenes.apply_glow_anim(obj, ga.glow_duration, ga.glow_period,
                ga.glow_relapses);
    }
}

/**
 * Stop glowing animation for the object.
 * @method module:scenes.clear_glow_anim
 * @param {Object} obj Object ID
 */
exports.clear_glow_anim = function(obj) {
    if (obj._render && obj._render.selectable)
        m_scenes.clear_glow_anim(obj);
}

/**
 * Set the color of glowing
 * @method module:scenes.set_glow_color
 * @param {Float32Array} color Color
 */
exports.set_glow_color = function(color) {
    var scene = m_scenes.get_active();
    var subs = m_scenes.get_subs(scene, "GLOW");
    if (subs) {
        subs.glow_color.set(color);
        subs.need_perm_uniforms_update = true;
    }
}

/**
 * @method module:scenes.set_light_pos
 * @deprecated use lights module instead
 */
exports.set_light_pos = function() {
    m_print.error("set_light_pos() deprecated, use lights module instead");
}

/**
 * @method module:scenes.set_light_direction
 * @deprecated use lights module instead
 */
exports.set_light_direction = function() {
    m_print.error("set_light_direction() deprecated, use lights module instead");
}

/**
 * @method module:scenes.set_dir_light_color
 * @deprecated use lights module instead
 */
exports.set_dir_light_color = function(index, val) {
    m_print.error("set_dir_light_color() deprecated, use lights module instead");
}

/**
 * @method module:scenes.get_lights_names
 * @deprecated use lights module instead
 */
exports.get_lights_names = function() {
    m_print.error("set_dir_light_color() deprecated, use lights module instead");
}

/**
 * Get shadow params.
 * @method module:scenes.get_shadow_params
 * @returns {Object} Shadow params
 * @cc_externs blur_depth_size_mult blur_depth_edge_size
 * @cc_externs blur_depth_diff_threshold shadow_visibility_falloff
 * @cc_externs csm_near csm_far csm_num csm_lambda csm_borders
 */
exports.get_shadow_params = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }

    var active_scene = m_scenes.get_active();
    var shadow_cast  = m_scenes.get_subs(active_scene, "SHADOW_CAST");

    if (!shadow_cast)
        return null;

    var shadow_params = {};

    var subs = m_scenes.get_subs(active_scene, "BLUR_DEPTH");
    if (subs) {
        shadow_params.blur_depth_size_mult = subs.blur_depth_size_mult;
        shadow_params.blur_depth_edge_size = subs.blur_depth_edge_size;
        shadow_params.blur_depth_diff_threshold = subs.blur_depth_diff_threshold * 1000;
    }

    var subs = m_scenes.get_subs(active_scene, "DEPTH");
    if (subs) {
        shadow_params.shadow_visibility_falloff = subs.shadow_visibility_falloff;
    }

    var shs = active_scene._render.shadow_params;
    shadow_params.csm_near = shs.csm_near;
    shadow_params.csm_far = shs.csm_far;
    shadow_params.csm_num = shs.csm_num;
    shadow_params.csm_lambda = shs.csm_lambda;
    shadow_params.csm_borders = m_scenes.get_csm_borders(active_scene);

    return shadow_params;
}

/**
 * Set shadow params
 * @method module:scenes.set_shadow_params
 * @param {Object} shadow_params Shadow params
 */
exports.set_shadow_params = function(shadow_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }

    var active_scene = m_scenes.get_active();
    var subscenes = m_scenes.subs_array(active_scene, LIGHT_SUBSCENE_TYPES);

    var subs = m_scenes.get_subs(active_scene, "DEPTH");
    if (subs) {
        if (typeof shadow_params.shadow_visibility_falloff == "number")
            subs.shadow_visibility_falloff = shadow_params.shadow_visibility_falloff;
    }

    var subscenes = m_scenes.subs_array(active_scene, ["BLUR_DEPTH"]);

    for (var i = 0; i < subscenes.length; i++) {

        var subs = subscenes[i];

        if (typeof shadow_params.blur_depth_size_mult == "number") {
            subs.blur_depth_size_mult = shadow_params.blur_depth_size_mult;

            var bundles = subs.bundles;
            var batch = bundles[0].batch;
            if (batch) {
                m_batch.set_texel_size_mult(batch, shadow_params.blur_depth_size_mult);
                m_scenes.set_texel_size(subs, 1/subs.camera.width, 1/subs.camera.width);
            }
        }

        if (typeof shadow_params.blur_depth_edge_size == "number")
            subs.blur_depth_edge_size = shadow_params.blur_depth_edge_size;

        if (typeof shadow_params.blur_depth_diff_threshold == "number")
            subs.blur_depth_diff_threshold = shadow_params.blur_depth_diff_threshold / 1000;

        subs.need_perm_uniforms_update = true;
    }

    var shs = active_scene._render.shadow_params;

    if (typeof shadow_params.csm_near == "number")
        shs.csm_near = shadow_params.csm_near;

    if (typeof shadow_params.csm_far == "number")
        shs.csm_far = shadow_params.csm_far;

    if (typeof shadow_params.csm_lambda == "number")
        shs.csm_lambda = shadow_params.csm_lambda;

    // update directives; only depth subs supported
    var subs = m_scenes.get_subs(active_scene, "DEPTH");
    if (subs) {

        var bundles = subs.bundles;

        for (var i = 0; i < bundles.length; i++) {

            var bundle = bundles[i];

            if (!bundle.obj_render.shadow_receive)
                continue;

            var batch = bundle.batch;

            m_batch.assign_shadow_receive_dirs(batch, m_scenes.get_csm_borders(active_scene));

            m_batch.update_shader(batch);
        }
        subs.need_perm_uniforms_update = true;
    }
    m_scenes.schedule_shadow_update(active_scene);
}

/**
 * Get horizon and zenith colors of the environment.
 * @method module:scenes.get_environment_colors
 * @returns {Array} Environment colors
 */
exports.get_environment_colors = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    return m_scenes.get_environment_colors(active_scene);
}

/**
 * Set horizon and/or zenith color(s) of the environment.
 * @method module:scenes.set_environment_colors
 * @param {Number} [opt_environment_energy] Environment Energy
 * @param {Float32Array} [opt_horizon_color] Horizon color
 * @param {Float32Array} [opt_zenith_color] Zenith color
 */
exports.set_environment_colors = function(opt_environment_energy,
        opt_horizon_color, opt_zenith_color) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_environment_colors(active_scene,
            parseFloat(opt_environment_energy), opt_horizon_color,
            opt_zenith_color);
}

/**
 * Get fog color and density.
 * @method module:scenes.get_fog_color_density
 * @param {Float32Array} dest Destnation vector [C,C,C,D]
 * @returns {Float32Array} Destnation vector
 */
exports.get_fog_color_density = function(dest) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    return m_scenes.get_fog_color_density(active_scene, dest);
}

/**
 * Set fog color and density
 * @method module:scenes.set_fog_color_density
 * @param {Float32Array} val Color-density vector [C,C,C,D]
 */
exports.set_fog_color_density = function(val) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_fog_color_density(active_scene, val);
}

/**
 * Get SSAO params
 * @method module:scenes.get_ssao_params
 * @returns {Object} SSAO params
 */
exports.get_ssao_params = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    return m_scenes.get_ssao_params(active_scene);
}

/**
 * Set SSAO params
 * @method module:scenes.set_ssao_params
 * @param {Object} ssao_params SSAO params
 * @param {Number} ssao_params.radius_increase Radius Increase
 * @param {Number} ssao_params.depth_min Depth minimum
 * @cc_externs ssao_quality radius_increase dithering_amount
 * @cc_externs gauss_width_square gauss_width_left_square ssao_white
 * @cc_externs influence dist_factor ssao_only gauss_center
 */
exports.set_ssao_params = function(ssao_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_ssao_params(active_scene, ssao_params);
}

/**
 * Get color correction params
 * @method module:scenes.get_color_correction_params
 * @returns {Object} Color correction params
 * @cc_externs brightness contrast exposure saturation
 */
exports.get_color_correction_params = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return null;
    }

    var active_scene = m_scenes.get_active();
    var subs = m_scenes.get_subs(active_scene, "COMPOSITING");
    if (!subs)
        return null;

    var compos_params = {};

    compos_params.brightness = subs.brightness;
    compos_params.contrast = subs.contrast;
    compos_params.exposure = subs.exposure;
    compos_params.saturation = subs.saturation;

    return compos_params;
}

/**
 * Set color correction params
 * @method module:scenes.set_color_correction_params
 * @param {Object} Color correction params
 */
exports.set_color_correction_params = function(compos_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return null;
    }

    var active_scene = m_scenes.get_active();
    var subs = m_scenes.get_subs(active_scene, "COMPOSITING");
    if (!subs)
        return null;

    if (typeof compos_params.brightness == "number")
        subs.brightness = compos_params.brightness;

    if (typeof compos_params.contrast == "number")
        subs.contrast = compos_params.contrast;

    if (typeof compos_params.exposure == "number")
        subs.exposure = compos_params.exposure;

    if (typeof compos_params.saturation == "number")
        subs.saturation = compos_params.saturation;

    subs.need_perm_uniforms_update = true;
}

/**
 * Get sky params
 * @method module:scenes.get_sky_params
 * @returns {Object} Sky params
 */
exports.get_sky_params = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    return m_scenes.get_sky_params(active_scene);
}

/**
 * Set sky params
 * @method module:scenes.set_sky_params
 * @param {Object} sky_params Sky params
 * @cc_externs procedural_skydome use_as_environment_lighting
 * @cc_externs rayleigh_brightness mie_brightness spot_brightness
 * @cc_externs scatter_strength rayleigh_strength mie_strength
 * @cc_externs rayleigh_collection_power mie_collection_power
 * @cc_externs mie_distribution color
 */
exports.set_sky_params = function(sky_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_sky_params(active_scene, sky_params);
}

/**
 * Get depth-of-field (DOF) params.
 * @method module:scenes.get_dof_params
 * @returns {Object} DOF params
 */
exports.get_dof_params = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    var subs = m_scenes.get_subs(active_scene,"DOF");
    if (subs)
        return m_scenes.get_dof_params(active_scene);
    else
        return null;
}

/**
 * Set depth-of-field (DOF) params
 * @method module:scenes.set_dof_params
 * @param {Object} DOF params
 * @cc_externs dof_on dof_distance dof_front dof_rear dof_power
 */
exports.set_dof_params = function(dof_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_dof_params(active_scene, dof_params);
}

/**
 * Get god rays parameters
 * @method module:scenes.get_god_rays_params
 * @returns {Object} god rays parameters
 */
exports.get_god_rays_params = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    var subs = m_scenes.get_subs(active_scene,"GOD_RAYS");
    if (subs)
        return m_scenes.get_god_rays_params(active_scene);
    else
        return null;
}

/**
 * Set god rays parameters
 * @method module:scenes.set_god_rays_params
 * @param {Object} god rays params
 * @cc_externs god_rays_max_ray_length god_rays_intensity god_rays_steps
 */
exports.set_god_rays_params = function(god_rays_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_god_rays_params(active_scene, god_rays_params);
}

/**
 * Get bloom parameters
 * @method module:scenes.get_bloom_params
 * @returns {Object} bloom parameters
 */
exports.get_bloom_params = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    var subs = m_scenes.get_subs(active_scene,"BLOOM");
    if (subs)
        return m_scenes.get_bloom_params(active_scene);
    else
        return null;
}

/**
 * Set bloom parameters
 * @method module:scenes.set_bloom_params
 * @param {Object} bloom params
 * @cc_externs bloom_key bloom_edge_lum bloom_blur
 */
exports.set_bloom_params = function(bloom_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_bloom_params(active_scene, bloom_params);
}

/**
 * Get wind parameters
 * @method module:scenes.get_wind_params
 * @returns {Object} Wind params
 */
exports.get_wind_params = function() {
    return m_scenes.get_wind_params();
}

/**
 * Set wind parameters
 * @method module:scenes.set_wind_params
 * @param {Object} wind params
 * @cc_externs wind_dir wind_strength
 */
exports.set_wind_params = function(wind_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_wind_params(active_scene, wind_params);
}

/**
 * Get water surface level.
 * @method module:scenes.get_water_surface_level
 * @returns {Number} surface level
 */
exports.get_water_surface_level = m_scenes.get_water_surface_level;

/**
 * Set water params
 * @method module:scenes.set_water_params
 * @param {Object} water params
 * @cc_externs waves_height waves_length water_fog_density water_fog_color
 * @cc_externs dst_noise_scale0 dst_noise_scale1 dst_noise_freq0 dst_noise_freq1
 * @cc_externs dir_min_shore_fac dir_freq dir_noise_scale dir_noise_freq
 * @cc_externs dir_min_noise_fac dst_min_fac waves_hor_fac water_dynamic
 */
exports.set_water_params = function(water_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_water_params(active_scene, water_params);
}

/**
 * Get water material parameters
 * @method module:scenes.get_water_mat_params
 * @param {Object} water params
 */
exports.get_water_mat_params = function(water_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.get_water_mat_params(active_scene, water_params);
}

/**
 * Update scene materials parameters
 * @method module:scenes.update_scene_materials_params
 */
exports.update_scene_materials_params = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.update_scene_permanent_uniforms(active_scene);
}

/**
 * Append the object to an active scene.
 * @method module:scenes.append_object
 * @deprecated Unused
 */
exports.append_object = function(obj) {
    throw "Method \"append_object\" is deprecated";
}

/**
 * @method module:scenes.add_object
 * @deprecated Unused
 */
exports.add_object = function(obj) {
    throw "Method \"add_object\" is deprecated";
}

/**
 * Remove the object from an active scene.
 * @method module:scenes.remove_object
 * @deprecated Unused
 */
exports.remove_object = function(obj) {
    throw "Method \"remove_object\" is deprecated";
}


/**
 * Hide object.
 * @method module:scenes.hide_object
 * @param {Object} obj Object ID
 */
exports.hide_object = function(obj) {
    m_scenes.hide_object(obj);
}

/**
 * Show object.
 * @method module:scenes.show_object
 * @param {Object} obj Object ID
 */
exports.show_object = function(obj) {
    m_scenes.show_object(obj);
}

/**
 * Check if object is visible.
 * @method module:scenes.is_visible
 * @param {Object} obj Object ID
 * @returns {Boolean} Check result
 */
exports.is_visible = function(obj) {
    return obj._render.is_visible;
}

/**
 * Check the object's availability in the active scene.
 * @method module:scenes.check_object
 * @param name Object name
 * @returns {Boolean} Check result
 */
exports.check_object = function(obj) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }

    return m_scenes.check_object(obj, m_scenes.get_active());
}

/**
 * Remove all objects from all scenes.
 * @method module:scenes.remove_all
 * @deprecated Usage is forbidden.
 */
exports.remove_all = function() {
    throw("unimplemented");
}
/**
 * Check if the object collides with an object/material which has the given collision ID.
 * @method module:scenes.check_collision
 * @deprecated By async physics
 */
exports.check_collision = function() {
    return false;
}
/**
 * Check if ray has hit through the collision ID.
 * @method module:scenes.check_ray_hit
 * @deprecated By async physics
 */
exports.check_ray_hit = function() {
    return false;
}


/**
 * Get all objects from the active scene.
 * @method module:scenes.get_all_objects
 * @param {String} [type="ALL"] Type
 * @param {Number} [data_id=DATA_ID_ALL] Objects data id
 * @returns {Array} Array with object IDs
 */
exports.get_all_objects = function(type, data_id) {
    var scene = m_scenes.get_active();

    if (!type)
        type = "ALL";

    if (!data_id && data_id !== 0)
        data_id = m_scenes.DATA_ID_ALL;

    return m_scenes.get_scene_objs(scene, type, data_id);
}

/**
 * Get objects appended to the active scene.
 * @method module:scenes.get_appended_objs
 * @param {String} [type] Type
 * @param {Number} [data_id] Objects data id
 * @deprecated use scenes.get_all_objects instead
 */
exports.get_appended_objs = function(type, data_id) {
    m_print.warn("get_appended_objs() deprecated, use get_all_objects() instead");
    return exports.get_all_objects(type, data_id);
}

/**
 * Get the object's name.
 * @method module:scenes.get_object_name
 * @param {Object} obj Object ID
 * @returns {String} Object name
 */
exports.get_object_name = function(obj) {
    if (!obj) {
        m_print.error("Wrong object name");
        return "";
    }

    return obj["name"];
}

/**
 * Get the object's type.
 * @method module:scenes.get_object_type
 * @param {Object} obj Object ID
 * @return {String} Object type
 */
exports.get_object_type = function(obj) {
    if (!(obj && obj["type"])) {
        m_print.error("Wrong object ID");
        return "UNDEFINED";
    }

    return obj["type"];
}

/**
 * Return the object's parent.
 * @method module:scenes.get_object_dg_parent
 * @param {Object} obj Object ID
 * @returns {Object} Object ID of parent object
 */
exports.get_object_dg_parent = function(obj) {
    return obj._dg_parent;
}

/**
 * Return the object's children.
 * @method module:scenes.get_object_children
 * @param {Object} obj Object ID
 * @returns {Array} Array of children object IDs
 */
exports.get_object_children = function(obj) {
    return obj._descends.slice(0);
}

/**
 * Find the first character on the active scene.
 * @method module:scenes.get_first_character
 * @returns {Object} Character object ID
 */
exports.get_first_character = function() {
    var sobjs = m_scenes.get_scene_objs(m_scenes.get_active(), "MESH",
            m_scenes.DATA_ID_ALL);
    for (var i = 0; i < sobjs.length; i++) {
        var obj = sobjs[i];
        if (physics.is_character(obj)) {
            return obj;
        }
    }
    return null;
}

/**
 * Return the distance to the shore line.
 * @method module:scenes.get_shore_dist
 * @param {Float32Array} trans Current translation
 * @param {Number} [v_dist_mult=1] Vertical distance multiplier
 * @returns {Number} Distance
 */
exports.get_shore_dist = function(trans, v_dist_mult) {
    if (!v_dist_mult && v_dist_mult !== 0)
        v_dist_mult = 1;

    return m_scenes.get_shore_dist(trans, v_dist_mult);
}

/**
 * Return the camera water depth or null if there is no water.
 * @method module:scenes.get_cam_water_depth
 * @returns {Number} Depth
 */
exports.get_cam_water_depth = function() {
    return m_scenes.get_cam_water_depth();
}

/**
 * Return type of mesh object or null.
 * @method module:scenes.get_type_mesh_object
 * @param {Object} obj Object ID
 * @returns {String} Render type: "DYNAMIC" or "STATIC"
 */
exports.get_type_mesh_object = function(obj) {
    if (obj["type"] == "MESH")
        return obj._render.type;
    return null;
}

}