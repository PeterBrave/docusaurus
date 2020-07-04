/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');

const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

function Help(props) {
  const {config: siteConfig, language = ''} = props;
  const {baseUrl, docsUrl} = siteConfig;
  const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
  const langPart = `${language ? `${language}/` : ''}`;
  const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

  const supportLinks = [
    {
      content: "还没毕业",
      title: '学业',
    },
    {
      content: '爱出门，也爱宅家，爱Switch，爱Netflix',
      title: '爱好',
    },
    {
      content: "见习程序员一枚",
      title: '等级',
    },
  ];

  return (
    <div className="docMainWrapper wrapper">
      <Container className="mainContainer documentContainer postContainer">
        <div className="post">
        <header className="postHeader">
            <h1>About Website</h1>
          </header>
          <p>Because I am currently doing an internship and preparing for the autumn recruit, 
            there is no time to maintain the blog, 
            so the blog part currently uses the previous content.</p>
          <header className="postHeader">
            <h1>About Me</h1>
          </header>
          <p>注重养生，目前没有脱发烦恼，节假日喜欢出去玩，宅在家里当然更好，
            喜欢Switch，手残游戏党，但是依然不亦乐乎.</p>
          <a href="mailto:dsyhappy1234@gmail.com?subject=Peter's知识基地&body=Hi Peter:">联系我</a>
          <GridBlock contents={supportLinks} layout="threeColumn" />
          
        </div>
      </Container>
    </div>
  );
}

module.exports = Help;
