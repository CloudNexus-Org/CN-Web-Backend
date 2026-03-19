package com.cloudnexus.backend.service;

import com.cloudnexus.backend.config.ResourceNotFoundException;
import com.cloudnexus.backend.dto.BlogPostRequest;
import com.cloudnexus.backend.model.BlogPost;
import com.cloudnexus.backend.repository.BlogPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BlogService {

    private final BlogPostRepository blogPostRepository;

    public List<BlogPost> getAllPosts() {
        return blogPostRepository.findAll();
    }

    public List<BlogPost> getPublishedPosts() {
        return blogPostRepository.findByStatusOrderByPublishedAtDesc("Published");
    }

    public BlogPost getPostById(Long id) {
        return blogPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blog post not found with id: " + id));
    }

    public BlogPost getPostBySlug(String slug) {
        return blogPostRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Blog post not found with slug: " + slug));
    }

    public BlogPost createPost(BlogPostRequest request) {
        String baseSlug = generateSlug(request.getTitle());
        String slug = baseSlug;
        int count = 1;
        while (blogPostRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + count++;
        }
        
        BlogPost post = BlogPost.builder()
                .title(request.getTitle())
                .slug(slug)
                .content(request.getContent())
                .summary(request.getSummary())
                .author(request.getAuthor())
                .category(request.getCategory())
                .status(request.getStatus() != null ? request.getStatus() : "Draft")
                .coverImageUrl(request.getCoverImageUrl())
                .authorImageUrl(request.getAuthorImageUrl())
                .views(0)
                .build();

        if ("Published".equals(post.getStatus())) {
            post.setPublishedAt(LocalDateTime.now());
        }

        return blogPostRepository.save(post);
    }

    public BlogPost updatePost(Long id, BlogPostRequest request) {
        BlogPost post = getPostById(id);

        if (!post.getTitle().equals(request.getTitle())) {
            post.setSlug(generateSlug(request.getTitle()));
            post.setTitle(request.getTitle());
        }

        post.setContent(request.getContent());
        post.setSummary(request.getSummary());
        post.setAuthor(request.getAuthor());
        post.setCategory(request.getCategory());
        post.setCoverImageUrl(request.getCoverImageUrl());
        post.setAuthorImageUrl(request.getAuthorImageUrl());

        String newStatus = request.getStatus();
        if (newStatus != null && !newStatus.equals(post.getStatus())) {
            post.setStatus(newStatus);
            if ("Published".equals(newStatus) && post.getPublishedAt() == null) {
                post.setPublishedAt(LocalDateTime.now());
            }
        }

        return blogPostRepository.save(post);
    }

    public BlogPost incrementViews(Long id) {
        BlogPost post = getPostById(id);
        post.setViews(post.getViews() + 1);
        return blogPostRepository.save(post);
    }

    public void deletePost(Long id) {
        BlogPost post = getPostById(id);
        blogPostRepository.delete(post);
    }

    private String generateSlug(String title) {
        return title.toLowerCase().replaceAll("[^a-z0-9\\s]", "").replaceAll("\\s+", "-");
    }
}
