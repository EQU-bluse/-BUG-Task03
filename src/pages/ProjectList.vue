<template>
  <div class="wrapper">
    <!--项目列表页面-->
      <div class="edit_field">
          <el-button type="success" icon="plus" @click="handleAdd">新增</el-button>
          <el-button type="success" icon="edit" @click="handleEdit">修改</el-button>
      </div>
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="项目查询" name="first">
        <el-table :data="tableData" border stripe style="width: 100%" highlight-current-row empty-text="数据空空" height="400" @current-change="handleRowChange">
            <el-table-column label="序号" width="65">
                <template scope="scope">
                    <span>{{(page_size*(current_page-1)+scope.$index+1)|formatIndex1}}</span>
                </template>
            </el-table-column>
            <el-table-column label="项目名称">
                <template scope="scope">
                    <span>{{scope.row.project && scope.row.project.project_name || ''}}</span>
                </template>
            </el-table-column>
            <el-table-column label="合作渠道">
                <template scope="scope">
                    <span>{{scope.row.channel && scope.row.channel.name || ''}}</span>
                </template>
            </el-table-column>
            <el-table-column label="项目状态">
                <template scope="scope">
                    <span>{{scope.row.project && scope.row.project.project_status | formatStatus}}</span>
                </template>
            </el-table-column>
            <el-table-column label="项目上线时间">
                <template scope="scope">
                    <span>{{scope.row.project && scope.row.project.project_line_time || ''}}</span>
                </template>
            </el-table-column>
            <el-table-column label="项目终止时间">
                <template scope="scope">
                    <span>{{scope.row.project && scope.row.project.project_down_time || ''}}</span>
                </template>
            </el-table-column>
            <el-table-column label="项目批准额度">
                <template scope="scope">
                    <span>{{scope.row.project && scope.row.project.project_approved_sum || ''}}</span>
                </template>
            </el-table-column>
            <el-table-column label="项目可用额度">
                <template scope="scope">
                    <span>{{scope.row.project && scope.row.project.project_available_credit || ''}}</span>
                </template>
            </el-table-column>
          </el-table>
        <div class="block">
          <el-pagination
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                  :current-page="current_page"
                  :page-sizes="[6,10,15]"
                  :page-size="page_size"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="total">
          </el-pagination>
      </div>
      </el-tab-pane>

    </el-tabs>
  </div>
</template>

<script type="text/ecmascript-6">
  import api from 'fetch/api';
  import _ from 'lodash';
  let self='';
  export default {
      data () {
          return{
            activeTab: 'first',
            tableData: [],
            projectStatus:[],
            total:0,
            page_size:10,
            current_page:1,
            project_no:''
          }
      },
      methods:{
        handleAdd() {
            this.$router.push('/projectDetail/add');
        },
        handleEdit() {
            if(!this.project_no){
                this.$alert('请选择一条记录', '提示', {
                    confirmButtonText: '确定'
                });
                return;
            }
            this.$router.push({path:'/projectDetail/edit',query:{project_no:this.project_no}});
        },
        handleSizeChange(val) {
          this.page_size=val;
          this._getData(this.current_page,this.page_size);
        },
        handleCurrentChange(val) {
          this.current_page=val;
          this._getData(this.current_page,this.page_size);
        },
        handleRowChange(val) {
            if (val && val.project) {
                this.project_no=val.project.project_no;
            }
        },
        _getData(current_page,page_size){
          api.GetProjects({
            current_page,
            page_size,
            channel_name: this.$route.query.channel_name,
            project_name: this.$route.query.project_name,
            project_status: this.$route.query.project_status
          })
            .then(res => {
              if(res.code=='01'){
                this.tableData=res.result.rows;
                this.total=res.result.count;
                this.projectStatus=res.result.projectStatus;
              }else{
                this.$alert(res.result, '提示', {
                  confirmButtonText: '确定'
                });
              }
            })
            .catch(error => {
              console.log(error)
            });
        }
      },
      created(){
         self=this;
         this._getData(this.current_page,this.page_size)
      },
      filters: {
          formatStatus(value) {
              return _.result(_.find(self.projectStatus, { 'code_value': value+''}), 'code_name');
          }
      },
  }
</script>
<style lang="stylus" rel="stylesheet/stylus">
  .el-message-box__close
     top: 0px
     right: 0px
  .edit_field
      float: right
      margin: 0 0 10px
      position:relative
      z-index:1
  .el-table
    .el-table__body
      tr
        &.current-row>td
           background: #8D34AA!important;
           color:white;
    th,td
      text-align center
      .cell
         word-break: keep-all
         white-space: nowrap
  .el-pagination
    margin: 20px 0 0
    float: right
</style>
