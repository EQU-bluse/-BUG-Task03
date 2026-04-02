/**
 * 演示数据种子：字典码、渠道、项目、客户、额度、测试账号
 * 用法：node scripts/seed-demo-data.js
 */
require('dotenv').config()
require('../server/sequelize-mysql2-shim')

var db = require('../server/models').client
var models = require('../server/models')

function run (sql) {
  return db.query(sql)
}

async function ensureColumns () {
  var alters = [
    "ALTER TABLE t_cst_base_info ADD COLUMN cst_full_name VARCHAR(255) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN worker_amt DECIMAL(16,2) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN credit_code VARCHAR(64) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN reg_person VARCHAR(64) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN reg_num VARCHAR(64) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN reg_amt VARCHAR(64) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN main_biz VARCHAR(255) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN create_date VARCHAR(32) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN industry_type VARCHAR(64) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN firms_nature VARCHAR(64) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN company_email VARCHAR(128) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN pid VARCHAR(64) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN checkin_date VARCHAR(32) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN address VARCHAR(255) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN open_blank VARCHAR(64) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN business_term_start VARCHAR(32) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN business_term_end VARCHAR(32) NULL",
    "ALTER TABLE t_cst_base_info ADD COLUMN place_type VARCHAR(64) NULL",
    "ALTER TABLE t_cst_vice_info ADD COLUMN cst_credit_level VARCHAR(32) NULL",
    "ALTER TABLE t_cst_vice_info ADD COLUMN credit_evaluate_date VARCHAR(32) NULL",
    "ALTER TABLE t_cst_vice_info ADD COLUMN credit_evaluate_date_out VARCHAR(32) NULL",
    "ALTER TABLE t_cst_vice_info ADD COLUMN credit_evaluate_org_out VARCHAR(128) NULL",
    "ALTER TABLE t_quota ADD COLUMN quotaId INT NULL",
    "ALTER TABLE t_quota ADD COLUMN already_used_amount DECIMAL(16,2) NULL",
    "ALTER TABLE t_quota ADD COLUMN credit_apply_create_time VARCHAR(32) NULL",
    "ALTER TABLE t_quota ADD COLUMN credit_apply_expire_time VARCHAR(32) NULL",
    "ALTER TABLE t_quota ADD COLUMN sys_credit DECIMAL(16,2) NULL"
  ]
  for (var i = 0; i < alters.length; i++) {
    try {
      await run(alters[i])
      console.log('[ok]', alters[i].slice(0, 60) + '...')
    } catch (e) {
      if (e && e.message && e.message.indexOf('Duplicate column') !== -1) {
        console.log('[skip] column exists')
      } else {
        throw e
      }
    }
  }
}

async function main () {
  await ensureColumns()

  await run('SET FOREIGN_KEY_CHECKS=0')
  await run('TRUNCATE TABLE t_channel_project')
  await run('TRUNCATE TABLE t_project')
  await run('TRUNCATE TABLE t_channel')
  await run('TRUNCATE TABLE t_code')
  await run('TRUNCATE TABLE t_quota')
  await run('TRUNCATE TABLE t_cst_vice_info')
  await run('TRUNCATE TABLE t_cst_base_info')
  await run('TRUNCATE TABLE control_user')
  await run('SET FOREIGN_KEY_CHECKS=1')

  // 字典：项目状态
  var projectCodes = [
    [1, 'PS', 'ProjectStatusCd', '1', '筹备中', ''],
    [2, 'PS', 'ProjectStatusCd', '2', '进行中', ''],
    [3, 'PS', 'ProjectStatusCd', '3', '已结项', '']
  ]
  for (var p = 0; p < projectCodes.length; p++) {
    var r = projectCodes[p]
    await run(
      "INSERT INTO t_code (id, code_key_cd, code_type_cd, code_value, code_name, description) VALUES (" +
        r[0] + ",'" + r[1] + "','" + r[2] + "','" + r[3] + "','" + r[4] + "','" + r[5] + "')"
    )
  }
  // 额度状态
  var limitCodes = [
    [10, 'LS', 'LimitStatusCd', '0', '正常', ''],
    [11, 'LS', 'LimitStatusCd', '1', '冻结', '']
  ]
  for (var l = 0; l < limitCodes.length; l++) {
    var x = limitCodes[l]
    await run(
      "INSERT INTO t_code (id, code_key_cd, code_type_cd, code_value, code_name, description) VALUES (" +
        x[0] + ",'" + x[1] + "','" + x[2] + "','" + x[3] + "','" + x[4] + "','" + x[5] + "')"
    )
  }

  // 渠道
  await run(
    "INSERT INTO t_channel (id, channel_no, name, org_cd, channel_approved_sum, channel_available_credit) VALUES " +
      "(1, 'CH001', '华东渠道', 'ORG001', 5000000.00, 3000000.00)," +
      "(2, 'CH002', '华北渠道', 'ORG002', 8000000.00, 5000000.00)"
  )

  // 项目（project_no 用固定字符串便于关联）
  await run(
    "INSERT INTO t_project (id, project_no, project_name, project_status, project_line_time, project_down_time, " +
      "project_approved_sum, project_available_credit, createUser, createTime, project_oper_down_time, project_update_time) VALUES " +
      "(1, 'PRJ2026001', '智能制造产线改造', 2, '2026-01-10', '2026-12-31', 1200000.00, 800000.00, 'demo', '2026-01-10', NULL, '2026-01-15')," +
      "(2, 'PRJ2026002', '供应链金融试点', 1, '2026-02-01', '2027-01-01', 5000000.00, 4500000.00, 'demo', '2026-02-01', NULL, NULL)"
  )

  await run(
    "INSERT INTO t_channel_project (id, channel_id, org_cd, project_id) VALUES " +
      "(1, 'CH001', 'ORG001', 'PRJ2026001')," +
      "(2, 'CH002', 'ORG002', 'PRJ2026002')"
  )

  // 客户主从 + 额度（company_id 与 base/vice 的 id 对应，用字符串）
  await run(
    "INSERT INTO t_cst_base_info (id, cst_full_name, worker_amt, credit_code, reg_person, address, create_date) VALUES " +
      "(1, '示例科技有限公司', 120.50, 'CRED001', '王经理', '上海市浦东新区示例路1号', '2025-06-01')," +
      "(2, '演示贸易股份公司', 85.00, 'CRED002', '李总', '北京市朝阳区演示大街99号', '2025-08-15')"
  )
  await run(
    "INSERT INTO t_cst_vice_info (id, cst_credit_level, credit_evaluate_date) VALUES " +
      "(1, 'AA', '2025-12-01')," +
      "(2, 'A', '2025-11-20')"
  )
  await run(
    "INSERT INTO t_quota (id, approved_sum, available_credit, freezen_status, freezing_amount, company_id, quotaId, " +
      "already_used_amount, credit_apply_create_time, credit_apply_expire_time, sys_credit) VALUES " +
      "(1, 5000000.00, 3200000.00, 0, 0.00, '1', 1, 1800000.00, '2026-01-05', '2027-01-05', 5000000.00)," +
      "(2, 3000000.00, 2100000.00, 0, 0.00, '2', 2, 900000.00, '2026-02-01', '2027-02-01', 3000000.00)"
  )

  // 测试账号（走模型，密码 bcrypt）
  await models.control_user.create({
    name: 'demo',
    password: 'demo123456',
    crealname: '演示用户'
  })

  console.log('')
  console.log('--- 种子数据已写入 ---')
  console.log('登录账号: demo')
  console.log('登录密码: demo123456')
  console.log('（crealname 入库会为「客户:演示用户」）')
  console.log('')
  process.exit(0)
}

main().catch(function (err) {
  console.error(err)
  process.exit(1)
})
