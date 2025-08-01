<template>
    <el-row>
        <el-col :span="24">
            <div class="page-header">
                {{title}}
                <slot name="title"></slot>
            </div>
        </el-col>
    </el-row>
</template>

<script>
export default {
    name: "PageHeader",
    props: ['title']
}
</script>

<style scoped>
.page-header{
    color: rgba(0,0,0,.87);
    font-size: 1.8rem;
    padding-left: 30px;
}

@media (max-width: 600px) {
    .page-header {
        font-size: 1.2rem;
    }
}
</style>
