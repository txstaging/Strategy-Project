import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IAddBlogResponse } from '../interfaces/IAddBlogBody';
import { IDeleteBlogResponse } from '../interfaces/IDeleteBlogResponse';
import { IGetAllBlogsResponse } from '../interfaces/IGetAllBlogs';
import { IGetBlogByIdResponse } from '../interfaces/IGetBlogById';
import { IUpdateAllBlogStatusResponse } from '../interfaces/IUpdateAllBlogStatusResponse';
import { IUpdateBlogResponse } from '../interfaces/IUpdateBlogBody';


@Injectable({
  providedIn: 'root',
})
export class BlogService {

  private readonly http = inject(HttpClient)



getAllBlogs() {
  return this.http.get<IGetAllBlogsResponse>('/Blogs')
}

getAllBlogsAdmin() {
  return this.http.get<IGetAllBlogsResponse>('/Blogs/v2')
}

addBlogs(blogData: FormData) {
  return this.http.post<IAddBlogResponse>('/Blogs', blogData)
}

getBlogById(id: number) {
  return this.http.get<IGetBlogByIdResponse>(`/Blogs/${id}`)
}

markAllBlogStatusFalse() {
  return this.http.post<IUpdateAllBlogStatusResponse>('/Blogs/UpdateAllStatus', { Status: false })
}

updateBlog( blogData: FormData) {
  return this.http.post<IUpdateBlogResponse>(`/Blogs`, blogData)
}

updateBlogStatus(blogId: number, status: boolean) {
  const FD = new FormData();
  FD.append('Id', blogId.toString());
  FD.append('Status', status.toString());
  return this.http.post<IUpdateBlogResponse>(`/Blogs`, FD)
}

deleteBlog(id: number) {
  return this.http.delete<IDeleteBlogResponse>(`/Blogs/${id}`)
}
}
