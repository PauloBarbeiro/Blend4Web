if (b4w.module_check("golems"))
    throw "Failed to register module: golems";

b4w.register("golems", function(exports, require) {

var m_ctl = require("controls");
var m_scs = require("scenes");
var m_anim = require("animation");
var m_sfx = require("sfx");
var m_trans = require("transform");
var m_util  = require("util");
var m_vec3  = require("vec3");
var m_quat  = require("quat");

var m_conf = require("game_config");
var m_char = require("character");
var m_combat = require("combat");
var m_obelisks = require("obelisks");
var m_bonuses = require("bonuses");
var m_gems = require("gems");

var _golems_wrappers = [];

var _vec3_tmp = new Float32Array(3);
var _vec3_tmp_2 = new Float32Array(3);
var _vec3_tmp_3 = new Float32Array(3);
var _quat4_tmp = new Float32Array(4);
var _quat4_tmp2 = new Float32Array(4);

var _golems_spawn_timer = 0;

function golem_ai_cb(golem_wrapper, id) {

    var island_id = golem_wrapper.island_id;
    if (island_id == -1) // golem is not on any island
        return;

    if (golem_wrapper.hp <= 0) {
        kill_golem(golem_wrapper);
        return;
    }

    if (golem_wrapper.state == m_conf.GS_GETTING_OUT)
        return;

    if (golem_wrapper.state == m_conf.GS_ATACKING) {
        process_golems_atack(golem_wrapper);
        return;
    }

    var elapsed = m_ctl.get_sensor_value(golem_wrapper, id, 0);

    var char_wrapper = m_char.get_wrapper();

    if (char_wrapper.island == island_id && char_wrapper.hp > 0) {
        atack_target(golem_wrapper, char_wrapper.phys_body, elapsed);
        golem_wrapper.last_target = m_conf.GT_CHAR;
    } else if (m_obelisks.num_gems(island_id)) {
        var obelisk = get_obelisk_by_island_id(island_id);
        atack_target(golem_wrapper, obelisk, elapsed);
        golem_wrapper.last_target = m_conf.GT_OBELISK;
    } else {
        golem_patrol(golem_wrapper, elapsed);
    }
}

function kill_golem(golem_wrapper) {
    var golem = golem_wrapper.empty;
    var golem_death_empty = m_scs.get_object_by_name(m_conf.GOLEMS_DEATH_EMPTY);
    var golem_death = m_scs.get_object_by_dupli_name(m_conf.GOLEMS_DEATH_EMPTY,
                                                     m_conf.GOLEMS_DEATH_RIG);
    var golem_death_blow = m_scs.get_object_by_dupli_name(m_conf.GOLEMS_DEATH_EMPTY,
                                                          m_conf.GOLEMS_DEATH_BLOW);
    var trans = _vec3_tmp;
    var quat = _quat4_tmp;

    m_trans.get_translation(golem, trans);
    m_trans.get_rotation_quat(golem, quat);
    m_trans.set_translation_v(golem_death_empty, trans);
    m_trans.set_rotation_v(golem_death_empty, quat);

    m_anim.apply(golem_death, "golem_death");
    m_anim.set_behavior(golem_death, m_anim.AB_FINISH_STOP);
    m_anim.play(golem_death);

    m_anim.play(golem_death_blow);
    m_sfx.stop(golem_wrapper.walk_speaker);

    m_trans.set_translation_v(golem, m_conf.DEFAULT_POS);
    var island_id = golem_wrapper.island_id;
    golem_wrapper.island_id = -1;
    m_gems.spawn(trans);
    m_obelisks.change_gems_num(island_id, 0);
}

function process_golems_atack(golem_wrapper) {
    if (!golem_wrapper.atack_done) {
        var frame = m_anim.get_frame(golem_wrapper.rig);
        if (frame >= m_conf.GOLEM_ATACK_ANIM_FRAME) {
            if (golem_wrapper.last_target == m_conf.GT_CHAR)
                process_golem_char_atack(golem_wrapper);
            else if (golem_wrapper.last_target == m_conf.GT_OBELISK)
                process_golem_obelisk_atack(golem_wrapper);
            golem_wrapper.atack_done = true;
        }
    }
}

function process_golem_char_atack(golem_wrapper) {

    if(!m_combat.check_atack(golem_wrapper.atack_point,
                   m_char.get_wrapper().phys_body, m_conf.GOLEM_ATACK_DIST))
        return;

    var damage = -m_conf.GOLEM_ATACK_STRENGTH;
    if (m_bonuses.shield_time_left() > 0)
        damage *= m_conf.BONUS_SHIELD_EFFECT
    m_char.change_hp(damage);
    m_sfx.play_def(golem_wrapper.hit_speaker);
}

function process_golem_obelisk_atack(golem_wrapper) {

    var island_id = golem_wrapper.island_id;
    var obelisk = get_obelisk_by_island_id(island_id);

    if(!m_combat.check_atack(golem_wrapper.atack_point,
                   obelisk, m_conf.GOLEM_ATACK_DIST))
        return;

    if (m_obelisks.num_gems(island_id))
        m_obelisks.damage_obelisk(island_id);
    m_sfx.play_def(golem_wrapper.hit_speaker);
}

exports.init = function(elapsed_sensor) {
    _golems_spawn_timer = m_conf.GOLEMS_SPAWN_INTERVAL;
    for (var i = 0; i < m_conf.GOLEMS_EMPTIES.length; i++) {

        var empty_name = m_conf.GOLEMS_EMPTIES[i];

        var golem_empty = m_scs.get_object_by_name(empty_name);
        var golem = m_scs.get_object_by_dupli_name(empty_name, "golem_collider");
        var golem_rig = m_scs.get_object_by_dupli_name(empty_name, "golem_armature");

        var golem_wrapper = init_golem_wrapper(golem, golem_rig, golem_empty);

        golem_wrapper.walk_speaker = m_scs.get_object_by_dupli_name(empty_name,
                                                  m_conf.GOLEM_WALK_SPEAKER);
        golem_wrapper.atack_speaker = m_scs.get_object_by_dupli_name(empty_name,
                                                  m_conf.GOLEM_ATACK_SPEAKER);
        golem_wrapper.hit_speaker = m_scs.get_object_by_dupli_name(empty_name,
                                                  m_conf.GOLEM_HIT_SPEAKER);
        golem_wrapper.getout_speaker = m_scs.get_object_by_dupli_name(empty_name,
                                                  m_conf.GOLEM_GETOUT_SPEAKER);
        m_ctl.create_sensor_manifold(golem_wrapper, "GOLEM", m_ctl.CT_CONTINUOUS,
                                     [elapsed_sensor], null, golem_ai_cb);
        _golems_wrappers.push(golem_wrapper);
    }
    m_combat.set_enemies(_golems_wrappers);
}

exports.reset = function() {
    _golems_spawn_timer = m_conf.GOLEMS_SPAWN_INTERVAL;
    for (var i = 0; i < _golems_wrappers.length; i++) {
        var gw = _golems_wrappers[i];
        gw.island_id = -1;
        var golem = gw.empty;
        m_trans.set_translation_v(golem, m_conf.DEFAULT_POS);
        m_sfx.stop(gw.walk_speaker);
    }
}

function init_golem_wrapper(body, rig, empty) {
    return {
        body: body,
        rig: rig,
        empty: empty,
        hp: m_conf.GOLEM_HP,
        island_id: -1,
        dest_point: 0,
        dest_pos: new Float32Array(3),
        last_target: m_conf.GT_POINT,
        state: m_conf.GS_GETTING_OUT,
        atack_point: new Float32Array(3),
        atack_done: false,
        walk_speaker: null,
        atack_speaker: null,
        hit_speaker: null,
        getout_speaker: null
    }
}

function golem_patrol(golem_wrapper, elapsed) {
    set_golem_dest_point(golem_wrapper);
    rotate_golem(golem_wrapper, elapsed);
    translate_golem(golem_wrapper, elapsed);
}

function set_golem_dest_point(golem_wrapper) {

    var golem_empty = golem_wrapper.empty;
    var dest_pos = golem_wrapper.dest_pos;

    var trans = _vec3_tmp;

    m_trans.get_translation(golem_empty, trans);

    var dist_to_dest = m_vec3.distance(trans, dest_pos);
    if (dist_to_dest > 0.05 && golem_wrapper.last_target == m_conf.GT_POINT)
        return;

    golem_wrapper.last_target = m_conf.GT_POINT;
    golem_set_random_destination(golem_wrapper, trans);
}

function golem_set_random_destination(golem_wrapper, trans) {

    var dest_pos = golem_wrapper.dest_pos;
    var dest_point = golem_wrapper.dest_point
    var island_id = golem_wrapper.island_id;

    var rand = Math.random();
    var point_ind = Math.floor(m_conf.POINTS_PER_ISL * rand);
    var pind = 0;

    for (var i = 0; i < m_conf.POINTS_PER_ISL; i++) {
        if (i != dest_point && pind++ == point_ind) {
            var new_pind  = m_conf.POINTS_PER_ISL * island_id + i;
            var point_name = m_conf.GOLEM_PATROL_POINTS[new_pind];
            var point_obj  = m_scs.get_object_by_name(point_name);
            m_trans.get_translation(point_obj, dest_pos);
            dest_pos[1] = trans[1];
            golem_wrapper.dest_point = i;
            return;
        }
    }
    golem_wrapper.dest_point = -1;
}

function atack_target(golem_wrapper, target, elapsed) {
    var golem_empty = golem_wrapper.empty;
    var golem_rig = golem_wrapper.rig;
    var at_pt = golem_wrapper.atack_point;
    var at_dst = m_conf.GOLEM_ATACK_DIST;

    var trans      = _vec3_tmp;
    var targ_trans = _vec3_tmp_2;

    m_trans.get_translation(golem_empty, trans);
    m_trans.get_translation(target, targ_trans);

    golem_wrapper.dest_pos.set(targ_trans);
    var dist_to_targ = m_vec3.distance(trans, targ_trans)

    rotate_golem(golem_wrapper, elapsed);

    if (dist_to_targ >= at_dst)
        translate_golem(golem_wrapper, elapsed);
    else {
        if (m_sfx.is_play(golem_wrapper.walk_speaker))
            m_sfx.stop(golem_wrapper.walk_speaker);
        m_trans.get_translation(golem_empty, trans);
        m_trans.get_translation(target, targ_trans);

        var dir_to_targ = _vec3_tmp_3;
        m_vec3.subtract(targ_trans, trans, dir_to_targ);
        dir_to_targ[1] = 0;
        m_vec3.normalize(dir_to_targ, dir_to_targ);

        var cur_dir     = _vec3_tmp_2;
        var cur_rot_q  = _quat4_tmp;

        m_trans.get_rotation_quat(golem_empty, cur_rot_q);
        m_vec3.transformQuat(m_util.AXIS_Z, cur_rot_q, cur_dir);
        var dir_dot =  Math.min(m_vec3.dot(dir_to_targ, cur_dir), 1.0);

        var angle = Math.acos(dir_dot);
        if (angle < 0.1 * Math.PI) {
            golem_wrapper.state = m_conf.GS_ATACKING;
            golem_wrapper.atack_done = false;

            var rand = Math.floor(3 * Math.random()) + 1;
            m_anim.apply(golem_rig, "golem_atack_0" + rand);
            m_anim.set_behavior(golem_rig, m_anim.AB_FINISH_STOP);

            m_sfx.play_def(golem_wrapper.atack_speaker);

            m_vec3.scaleAndAdd(trans, cur_dir, at_dst, at_pt);
            // raise atack point as golem's pos is given on the ground level
            at_pt[1] += 0.3;
            m_anim.play(golem_rig,
                function() {
                    golem_wrapper.state = m_conf.GS_WALKING;
                    m_anim.apply(golem_rig, "golem_walk")
                    m_anim.set_behavior(golem_rig, m_anim.AB_CYCLIC);
                    m_anim.play(golem_rig);
                });
        }
    }
}

function translate_golem(golem_wrapper, elapsed) {
    var trans     = _vec3_tmp;
    var cur_dir   = _vec3_tmp_2;
    var cur_rot_q = _quat4_tmp;

    var empty = golem_wrapper.empty;
    var walk_speaker = golem_wrapper.walk_speaker;

    m_trans.get_translation(empty, trans);
    m_trans.get_rotation_quat(empty, cur_rot_q);
    m_vec3.transformQuat(m_util.AXIS_Z, cur_rot_q, cur_dir);

    m_vec3.scaleAndAdd(trans, cur_dir, m_conf.GOLEM_SPEED * elapsed, trans);
    m_trans.set_translation_v(empty, trans);

    if (!m_sfx.is_play(walk_speaker)) {
        m_sfx.play_def(walk_speaker);
        m_sfx.cyclic(walk_speaker, true);
    }
}

function rotate_golem(golem_wrapper, elapsed) {

    var golem_empty = golem_wrapper.empty;
    var dest_pos = golem_wrapper.dest_pos;

    var trans       = _vec3_tmp;
    var cur_dir     = _vec3_tmp_2;
    var dir_to_dest = _vec3_tmp_3;
    var cur_rot_q   = _quat4_tmp;
    var new_rot_q   = _quat4_tmp2;

    m_trans.get_translation(golem_empty, trans);
    m_trans.get_rotation_quat(golem_empty, cur_rot_q);
    m_vec3.transformQuat(m_util.AXIS_Z, cur_rot_q, cur_dir);

    m_vec3.subtract(dest_pos, trans, dir_to_dest);
    dir_to_dest[1] = 0;
    m_vec3.normalize(dir_to_dest, dir_to_dest);

    m_quat.rotationTo(cur_dir, dir_to_dest, new_rot_q);
    m_quat.multiply(new_rot_q, cur_rot_q, new_rot_q);

    var vec_dot = m_vec3.dot(cur_dir, dir_to_dest);

    if (Math.abs(vec_dot) < 1) {
        var angle_to_turn = Math.acos(vec_dot);
        var angle_ratio   = Math.abs(angle_to_turn) / Math.PI;
        var slerp         = elapsed / angle_ratio * m_conf.GOLEM_ROT_SPEED;

        m_quat.slerp(cur_rot_q, new_rot_q, Math.min(slerp, 1), new_rot_q);
    }

    m_trans.set_rotation_v(golem_empty, new_rot_q);
}

exports.init_spawn = function(elapsed_sensor) {
    var spawn_points = [];
    var spawn_quats = [];
    for (var i = 0; i < m_conf.GOLEM_SPAWN_POINTS.length; i++) {
        var spawn_obj = m_scs.get_object_by_name(m_conf.GOLEM_SPAWN_POINTS[i]);
        var spawn_pos = m_trans.get_translation(spawn_obj);
        var spawn_rot = m_trans.get_rotation(spawn_obj);
        spawn_points.push(spawn_pos);
        spawn_quats.push(spawn_rot);
    }

    function golems_spawn_cb(obj, id) {

        var golem_wrapper = get_first_free_golem();

        if (!golem_wrapper)
            return;

        var elapsed = m_ctl.get_sensor_value(obj, id, 0);
        _golems_spawn_timer -= elapsed;

        if (_golems_spawn_timer <= 0) {
            _golems_spawn_timer = m_conf.GOLEMS_SPAWN_INTERVAL;

            var island_id = get_random_available_island();

            if (island_id == null) // no available islands
                return;

            spawn_golem(golem_wrapper, island_id, spawn_points, spawn_quats);
        }
    }
    m_ctl.create_sensor_manifold(null, "GOLEMS_SPAWN", m_ctl.CT_CONTINUOUS, [elapsed_sensor],
                                 null, golems_spawn_cb);
}

function get_first_free_golem() {
    for (var i = 0; i < _golems_wrappers.length; i++) {
        var gw = _golems_wrappers[i];
        if (gw.island_id == -1)
            return gw;
    }
    return null;
}

function spawn_golem(golem_wrapper, island_id, spawn_points, spawn_quats) {
    var golem_empty = golem_wrapper.empty;
    var golem_rig = golem_wrapper.rig;

    var getout_finish_cb = function(golem_rig) {
        m_anim.apply(golem_rig, "golem_walk")
        m_anim.set_behavior(golem_rig, m_anim.AB_CYCLIC);
        m_anim.play(golem_rig);
        var golem_wrapper = golem_wrapper_by_rig(golem_rig);
        golem_wrapper.state = m_conf.GS_WALKING;
    }

    var num_spawns = spawn_points.length / m_conf.NUM_ISLANDS;
    var spawn_id = Math.floor(Math.random() * num_spawns);
    var spawn_pt_id = num_spawns * island_id + spawn_id;
    var spawn_point = spawn_points[spawn_pt_id];
    var spawn_quat = spawn_quats[spawn_pt_id];

    m_trans.set_translation_v(golem_empty, spawn_point);
    m_trans.set_rotation_v(golem_empty, spawn_quat);

    m_anim.apply(golem_rig, "golem_getout");
    m_anim.play(golem_rig, getout_finish_cb);

    m_sfx.play_def(golem_wrapper.getout_speaker);

    golem_wrapper.island_id = island_id;
    golem_wrapper.dest_pos.set(spawn_point);
    golem_wrapper.hp = 100;
    golem_wrapper.state = m_conf.GS_GETTING_OUT;
}

function golem_wrapper_by_rig(rig) {
    for (var i = 0; i < _golems_wrappers.length; i++) {
        var gw = _golems_wrappers[i];
        if (gw.rig == rig)
            return gw;
    }
    return null;
}

function get_random_available_island() {
    var num_free = m_conf.NUM_ISLANDS;
    for (var i = 0; i < _golems_wrappers.length; i++) {
        if (!is_available_island(i))
            num_free--;
    }

    if (num_free == 0)
        return null;

    var id = Math.floor(Math.random() * num_free);

    var free_id = 0;
    for (var i = 0; i < m_conf.NUM_ISLANDS; i++) {
        if (is_available_island(i) && free_id++ == id)
                return i;
    }
    return null;
}

function is_available_island(island_id) {
    for (var i = 0; i < _golems_wrappers.length; i++)
        if (_golems_wrappers[i].island_id == island_id)
            return false;
        if (m_obelisks.is_filled(island_id))
            return false;
    return true;
}

exports.island_has_golems = function(island_id) {
    for (var i = 0; i < _golems_wrappers.length; i++)
        if (_golems_wrappers[i].island_id == island_id)
            return true;

    return false;
}

function get_obelisk_by_island_id(island_id) {
    var obelisk = m_scs.get_object_by_dupli_name("obelisk_" + island_id,
                                                 "obelisk");
    return obelisk;
}

})